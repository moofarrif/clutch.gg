import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { squads, squadMembers, squadInvitations, users } from '../database/schema';
import { eq, and, desc, sql, avg } from 'drizzle-orm';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SquadsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly notifications: NotificationsService,
  ) {}

  async create(creatorId: string, name: string, tag?: string) {
    // Check user doesn't already have a squad
    const existing = await this.db
      .select()
      .from(squadMembers)
      .where(eq(squadMembers.userId, creatorId));
    if (existing.length > 0) throw new ConflictException('Ya perteneces a una escuadra');

    const [creator] = await this.db.select({ mmr: users.mmr }).from(users).where(eq(users.id, creatorId));

    const [squad] = await this.db.insert(squads).values({
      name,
      tag,
      creatorId,
      avgMmr: creator?.mmr ?? 1000,
    }).returning();

    // Add creator as captain
    await this.db.insert(squadMembers).values({
      squadId: squad.id,
      userId: creatorId,
      role: 'captain',
    });

    return squad;
  }

  async findAll(limit = 20) {
    const squadList = await this.db.execute(sql`
      SELECT s.*, COALESCE(mc.member_count, 0)::int AS member_count
      FROM squads s
      LEFT JOIN (
        SELECT squad_id, count(*)::int AS member_count
        FROM squad_members
        GROUP BY squad_id
      ) mc ON mc.squad_id = s.id
      ORDER BY s.avg_mmr DESC
      LIMIT ${limit}
    `);

    return squadList;
  }

  async findById(squadId: string) {
    const [squad] = await this.db.select().from(squads).where(eq(squads.id, squadId));
    if (!squad) throw new NotFoundException('Escuadra no encontrada');

    const members = await this.db
      .select({
        userId: squadMembers.userId,
        role: squadMembers.role,
        joinedAt: squadMembers.joinedAt,
        name: users.name,
        mmr: users.mmr,
        photoUrl: users.photoUrl,
        city: users.city,
      })
      .from(squadMembers)
      .innerJoin(users, eq(squadMembers.userId, users.id))
      .where(eq(squadMembers.squadId, squadId));

    return { ...squad, members };
  }

  async getMySquad(userId: string) {
    const [membership] = await this.db
      .select({ squadId: squadMembers.squadId })
      .from(squadMembers)
      .where(eq(squadMembers.userId, userId));

    if (!membership) return null;
    return this.findById(membership.squadId);
  }

  async join(squadId: string, userId: string) {
    // Check not already in a squad
    const existing = await this.db
      .select()
      .from(squadMembers)
      .where(eq(squadMembers.userId, userId));
    if (existing.length > 0) throw new ConflictException('Ya perteneces a una escuadra');

    // Check squad exists and has space (max 5)
    const members = await this.db
      .select()
      .from(squadMembers)
      .where(eq(squadMembers.squadId, squadId));
    if (members.length >= 5) throw new BadRequestException('Escuadra llena (máximo 5)');

    await this.db.insert(squadMembers).values({ squadId, userId, role: 'member' });

    // Recalculate avg MMR
    await this.recalcAvgMmr(squadId);

    return { joined: true };
  }

  async leave(squadId: string, userId: string) {
    await this.db
      .delete(squadMembers)
      .where(and(eq(squadMembers.squadId, squadId), eq(squadMembers.userId, userId)));

    // Check if squad is empty → delete it
    const remaining = await this.db.select().from(squadMembers).where(eq(squadMembers.squadId, squadId));
    if (remaining.length === 0) {
      await this.db.delete(squads).where(eq(squads.id, squadId));
      return { left: true, deleted: true };
    }

    await this.recalcAvgMmr(squadId);
    return { left: true };
  }

  // ── Squad Invitations ──────────────────────────────────────────────

  async inviteUser(squadId: string, captainId: string, inviteeId: string) {
    // Verify captain
    await this.verifyCaptain(squadId, captainId);

    // Check invitee not already in any squad
    const existing = await this.db
      .select()
      .from(squadMembers)
      .where(eq(squadMembers.userId, inviteeId));
    if (existing.length > 0) throw new ConflictException('El jugador ya pertenece a una escuadra');

    // Check squad not full
    const members = await this.db
      .select()
      .from(squadMembers)
      .where(eq(squadMembers.squadId, squadId));
    if (members.length >= 5) throw new BadRequestException('Escuadra llena (máximo 5)');

    // Check no duplicate pending invite
    const [dup] = await this.db
      .select()
      .from(squadInvitations)
      .where(
        and(
          eq(squadInvitations.squadId, squadId),
          eq(squadInvitations.toUserId, inviteeId),
          eq(squadInvitations.status, 'pending'),
        ),
      );
    if (dup) throw new ConflictException('Ya existe una invitación pendiente para este jugador');

    // Remove old resolved invitations so re-invite works (unique constraint on squadId+toUserId)
    await this.db
      .delete(squadInvitations)
      .where(
        and(
          eq(squadInvitations.squadId, squadId),
          eq(squadInvitations.toUserId, inviteeId),
        ),
      );

    const [invite] = await this.db.insert(squadInvitations).values({
      squadId,
      fromUserId: captainId,
      toUserId: inviteeId,
      type: 'invite',
    }).returning();

    // Push notification to invitee
    const [captainUser] = await this.db.select({ name: users.name }).from(users).where(eq(users.id, captainId));
    const [squadInfo] = await this.db.select({ name: squads.name }).from(squads).where(eq(squads.id, squadId));
    await this.notifications.sendToUser(
      inviteeId,
      'Invitación de escuadra ⚽',
      `${captainUser?.name ?? 'Un capitán'} te invitó a ${squadInfo?.name ?? 'una escuadra'}`,
      { screen: '/squad' },
    );

    return invite;
  }

  async requestToJoin(squadId: string, userId: string) {
    // Check user not in any squad
    const existing = await this.db
      .select()
      .from(squadMembers)
      .where(eq(squadMembers.userId, userId));
    if (existing.length > 0) throw new ConflictException('Ya perteneces a una escuadra');

    // Check squad not full
    const members = await this.db
      .select()
      .from(squadMembers)
      .where(eq(squadMembers.squadId, squadId));
    if (members.length >= 5) throw new BadRequestException('Escuadra llena (máximo 5)');

    // Check no duplicate pending request
    const [dup] = await this.db
      .select()
      .from(squadInvitations)
      .where(
        and(
          eq(squadInvitations.squadId, squadId),
          eq(squadInvitations.fromUserId, userId),
          eq(squadInvitations.status, 'pending'),
          eq(squadInvitations.type, 'request'),
        ),
      );
    if (dup) throw new ConflictException('Ya enviaste una solicitud a esta escuadra');

    // Get captain
    const [captain] = await this.db
      .select({ userId: squadMembers.userId })
      .from(squadMembers)
      .where(and(eq(squadMembers.squadId, squadId), eq(squadMembers.role, 'captain')));
    if (!captain) throw new NotFoundException('Escuadra no encontrada');

    // Remove old non-pending invitations for this (squadId, toUserId) pair
    // The unique constraint is on (squad_id, to_user_id), so we must clear resolved records
    await this.db
      .delete(squadInvitations)
      .where(
        and(
          eq(squadInvitations.squadId, squadId),
          eq(squadInvitations.toUserId, captain.userId),
          sql`${squadInvitations.status} != 'pending'`,
        ),
      );

    const [request] = await this.db.insert(squadInvitations).values({
      squadId,
      fromUserId: userId,
      toUserId: captain.userId,
      type: 'request',
    }).returning();

    // Push notification to captain
    const [requester] = await this.db.select({ name: users.name }).from(users).where(eq(users.id, userId));
    const [squadInfo] = await this.db.select({ name: squads.name }).from(squads).where(eq(squads.id, squadId));
    await this.notifications.sendToUser(
      captain.userId,
      'Solicitud de escuadra 📩',
      `${requester?.name ?? 'Un jugador'} quiere unirse a ${squadInfo?.name ?? 'tu escuadra'}`,
      { screen: '/squad' },
    );

    return request;
  }

  async getMyInvites(userId: string) {
    const invites = await this.db
      .select({
        id: squadInvitations.id,
        squadId: squadInvitations.squadId,
        squadName: squads.name,
        fromUserId: squadInvitations.fromUserId,
        fromUserName: users.name,
        type: squadInvitations.type,
        status: squadInvitations.status,
        createdAt: squadInvitations.createdAt,
      })
      .from(squadInvitations)
      .innerJoin(squads, eq(squadInvitations.squadId, squads.id))
      .innerJoin(users, eq(squadInvitations.fromUserId, users.id))
      .where(
        and(
          eq(squadInvitations.toUserId, userId),
          eq(squadInvitations.status, 'pending'),
          eq(squadInvitations.type, 'invite'),
        ),
      );

    return invites;
  }

  async getPendingSquadInvites(squadId: string) {
    const pending = await this.db
      .select({
        id: squadInvitations.id,
        toUserId: squadInvitations.toUserId,
        toUserName: users.name,
        status: squadInvitations.status,
      })
      .from(squadInvitations)
      .innerJoin(users, eq(squadInvitations.toUserId, users.id))
      .where(
        and(
          eq(squadInvitations.squadId, squadId),
          eq(squadInvitations.status, 'pending'),
          eq(squadInvitations.type, 'invite'),
        ),
      );

    return pending;
  }

  async getSquadRequests(squadId: string, captainId: string) {
    await this.verifyCaptain(squadId, captainId);

    const requests = await this.db
      .select({
        id: squadInvitations.id,
        fromUserId: squadInvitations.fromUserId,
        fromUserName: users.name,
        fromUserMmr: users.mmr,
        fromUserPhotoUrl: users.photoUrl,
        type: squadInvitations.type,
        status: squadInvitations.status,
        createdAt: squadInvitations.createdAt,
      })
      .from(squadInvitations)
      .innerJoin(users, eq(squadInvitations.fromUserId, users.id))
      .where(
        and(
          eq(squadInvitations.squadId, squadId),
          eq(squadInvitations.status, 'pending'),
          eq(squadInvitations.type, 'request'),
        ),
      );

    return requests;
  }

  async acceptInvite(inviteId: string, userId: string) {
    const [invite] = await this.db
      .select()
      .from(squadInvitations)
      .where(eq(squadInvitations.id, inviteId));
    if (!invite) throw new NotFoundException('Invitación no encontrada');
    if (invite.status !== 'pending') throw new BadRequestException('Esta invitación ya fue procesada');

    let newMemberUserId: string;

    if (invite.type === 'invite') {
      // The invited user accepts
      if (invite.toUserId !== userId) throw new ForbiddenException('No tienes permiso');
      newMemberUserId = invite.toUserId;
    } else {
      // type === 'request' — the captain accepts
      await this.verifyCaptain(invite.squadId, userId);
      newMemberUserId = invite.fromUserId;
    }

    // Check new member not already in a squad
    const existing = await this.db
      .select()
      .from(squadMembers)
      .where(eq(squadMembers.userId, newMemberUserId));
    if (existing.length > 0) throw new ConflictException('El jugador ya pertenece a una escuadra');

    // Check squad not full
    const members = await this.db
      .select()
      .from(squadMembers)
      .where(eq(squadMembers.squadId, invite.squadId));
    if (members.length >= 5) throw new BadRequestException('Escuadra llena (máximo 5)');

    // Add member
    await this.db.insert(squadMembers).values({
      squadId: invite.squadId,
      userId: newMemberUserId,
      role: 'member',
    });

    // Update invite status
    await this.db
      .update(squadInvitations)
      .set({ status: 'accepted' })
      .where(eq(squadInvitations.id, inviteId));

    // Recalc avg MMR
    await this.recalcAvgMmr(invite.squadId);

    // Push notification
    const [newMember] = await this.db.select({ name: users.name }).from(users).where(eq(users.id, newMemberUserId));
    const [squadInfo] = await this.db.select({ name: squads.name }).from(squads).where(eq(squads.id, invite.squadId));

    if (invite.type === 'invite') {
      // Notify captain that the invited user joined
      const [cap] = await this.db
        .select({ userId: squadMembers.userId })
        .from(squadMembers)
        .where(and(eq(squadMembers.squadId, invite.squadId), eq(squadMembers.role, 'captain')));
      if (cap) {
        await this.notifications.sendToUser(
          cap.userId,
          'Nuevo miembro ✅',
          `${newMember?.name ?? 'Un jugador'} se unió a ${squadInfo?.name ?? 'tu escuadra'}`,
          { screen: '/squad' },
        );
      }
    } else {
      // Notify the requester that they were accepted
      await this.notifications.sendToUser(
        invite.fromUserId,
        'Solicitud aceptada ✅',
        `Te aceptaron en ${squadInfo?.name ?? 'la escuadra'}`,
        { screen: '/squad' },
      );
    }

    return { accepted: true };
  }

  async rejectInvite(inviteId: string, userId: string) {
    const [invite] = await this.db
      .select()
      .from(squadInvitations)
      .where(eq(squadInvitations.id, inviteId));
    if (!invite) throw new NotFoundException('Invitación no encontrada');
    if (invite.status !== 'pending') throw new BadRequestException('Esta invitación ya fue procesada');

    if (invite.type === 'invite') {
      if (invite.toUserId !== userId) throw new ForbiddenException('No tienes permiso');
    } else {
      // type === 'request' — the captain rejects
      await this.verifyCaptain(invite.squadId, userId);
    }

    await this.db
      .update(squadInvitations)
      .set({ status: 'declined' })
      .where(eq(squadInvitations.id, inviteId));

    return { rejected: true };
  }

  async kickMember(squadId: string, captainId: string, memberId: string) {
    await this.verifyCaptain(squadId, captainId);

    // Cannot kick yourself (captain)
    if (captainId === memberId) throw new BadRequestException('El capitán no puede expulsarse a sí mismo');

    // Verify member exists in squad
    const [member] = await this.db
      .select()
      .from(squadMembers)
      .where(and(eq(squadMembers.squadId, squadId), eq(squadMembers.userId, memberId)));
    if (!member) throw new NotFoundException('Miembro no encontrado en la escuadra');
    if (member.role === 'captain') throw new BadRequestException('No se puede expulsar al capitán');

    // Get squad name before deleting
    const [squadInfo] = await this.db.select({ name: squads.name }).from(squads).where(eq(squads.id, squadId));

    await this.db
      .delete(squadMembers)
      .where(and(eq(squadMembers.squadId, squadId), eq(squadMembers.userId, memberId)));

    await this.recalcAvgMmr(squadId);

    // Push notification to kicked member
    await this.notifications.sendToUser(
      memberId,
      'Removido de escuadra',
      `Fuiste removido de ${squadInfo?.name ?? 'la escuadra'}`,
      { screen: '/squad' },
    );

    return { kicked: true };
  }

  // ── Private helpers ────────────────────────────────────────────────

  private async verifyCaptain(squadId: string, userId: string) {
    const [membership] = await this.db
      .select()
      .from(squadMembers)
      .where(
        and(
          eq(squadMembers.squadId, squadId),
          eq(squadMembers.userId, userId),
          eq(squadMembers.role, 'captain'),
        ),
      );
    if (!membership) throw new ForbiddenException('Solo el capitán puede realizar esta acción');
  }

  private async recalcAvgMmr(squadId: string) {
    const [result] = await this.db
      .select({ avg: sql<number>`avg(${users.mmr})::int` })
      .from(squadMembers)
      .innerJoin(users, eq(squadMembers.userId, users.id))
      .where(eq(squadMembers.squadId, squadId));

    if (result?.avg) {
      await this.db.update(squads).set({ avgMmr: result.avg }).where(eq(squads.id, squadId));
    }
  }
}
