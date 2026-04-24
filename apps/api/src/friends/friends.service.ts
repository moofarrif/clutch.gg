import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { friendships, users } from '../database/schema';
import { eq, and, or, sql } from 'drizzle-orm';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FriendsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly notifications: NotificationsService,
  ) {}

  async sendRequest(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) throw new BadRequestException('No puedes agregarte a ti mismo');

    // Check if friendship already exists (in either direction)
    const [existing] = await this.db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.requesterId, requesterId), eq(friendships.addresseeId, addresseeId)),
          and(eq(friendships.requesterId, addresseeId), eq(friendships.addresseeId, requesterId)),
        ),
      );

    if (existing) {
      if (existing.status === 'accepted') throw new ConflictException('Ya son amigos');
      if (existing.status === 'pending') throw new ConflictException('Solicitud ya enviada');
    }

    const [friendship] = await this.db
      .insert(friendships)
      .values({ requesterId, addresseeId, status: 'pending' })
      .returning();

    // Notify addressee
    const [requester] = await this.db.select({ name: users.name }).from(users).where(eq(users.id, requesterId));
    await this.notifications.sendToUser(
      addresseeId,
      'Nueva solicitud de amistad 🤝',
      `${requester?.name ?? 'Alguien'} quiere ser tu amigo`,
      { screen: '/friends' },
    );

    return friendship;
  }

  async getFriends(userId: string) {
    const rows = await this.db
      .select({
        friendshipId: friendships.id,
        friendId: sql<string>`CASE WHEN ${friendships.requesterId} = ${userId} THEN ${friendships.addresseeId} ELSE ${friendships.requesterId} END`,
        friendName: users.name,
        friendMmr: users.mmr,
        friendPhotoUrl: users.photoUrl,
        friendCity: users.city,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .innerJoin(
        users,
        sql`${users.id} = CASE WHEN ${friendships.requesterId} = ${userId} THEN ${friendships.addresseeId} ELSE ${friendships.requesterId} END`,
      )
      .where(
        and(
          or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
          eq(friendships.status, 'accepted'),
        ),
      );

    return rows;
  }

  async getPendingRequests(userId: string) {
    return this.db
      .select({
        friendshipId: friendships.id,
        requesterId: friendships.requesterId,
        requesterName: users.name,
        requesterMmr: users.mmr,
        requesterPhotoUrl: users.photoUrl,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .innerJoin(users, eq(users.id, friendships.requesterId))
      .where(
        and(eq(friendships.addresseeId, userId), eq(friendships.status, 'pending')),
      );
  }

  async acceptRequest(friendshipId: string, userId: string) {
    const [friendship] = await this.db
      .select()
      .from(friendships)
      .where(and(eq(friendships.id, friendshipId), eq(friendships.addresseeId, userId)));

    if (!friendship) throw new NotFoundException('Solicitud no encontrada');
    if (friendship.status !== 'pending') throw new BadRequestException('Solicitud ya procesada');

    const [updated] = await this.db
      .update(friendships)
      .set({ status: 'accepted' })
      .where(eq(friendships.id, friendshipId))
      .returning();

    // Notify requester
    const [accepter] = await this.db.select({ name: users.name }).from(users).where(eq(users.id, userId));
    await this.notifications.sendToUser(
      friendship.requesterId,
      '¡Amistad aceptada! ✅',
      `${accepter?.name ?? 'Tu amigo'} aceptó tu solicitud`,
      { screen: '/friends' },
    );

    return updated;
  }

  async rejectRequest(friendshipId: string, userId: string) {
    const [friendship] = await this.db
      .select()
      .from(friendships)
      .where(and(eq(friendships.id, friendshipId), eq(friendships.addresseeId, userId)));

    if (!friendship) throw new NotFoundException('Solicitud no encontrada');

    await this.db.delete(friendships).where(eq(friendships.id, friendshipId));
    return { deleted: true };
  }

  async removeFriend(friendshipId: string, userId: string) {
    const [friendship] = await this.db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.id, friendshipId),
          or(eq(friendships.requesterId, userId), eq(friendships.addresseeId, userId)),
        ),
      );

    if (!friendship) throw new NotFoundException('Amistad no encontrada');

    await this.db.delete(friendships).where(eq(friendships.id, friendshipId));
    return { deleted: true };
  }
}
