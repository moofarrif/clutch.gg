import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DRIZZLE, type DrizzleDB } from '../database/database.provider';
import { matches, matchPlayers, users } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { GatewayService } from '../gateway/gateway.service';
import { MatchmakingProducer } from '../matchmaking/matchmaking.producer';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MatchJoinService {
  private readonly logger = new Logger(MatchJoinService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly gatewayService: GatewayService,
    private readonly matchmakingProducer: MatchmakingProducer,
    private readonly notifications: NotificationsService,
  ) {}

  async join(matchId: string, userId: string) {
    const { count: playerCount, isFull, maxPlayers } = await this.db.transaction(async (tx) => {
      // Lock the match row to prevent concurrent joins
      const [match] = await tx.execute(
        sql`SELECT * FROM matches WHERE id = ${matchId} FOR UPDATE`,
      );
      if (!match || match.status !== 'open') {
        throw new BadRequestException('Match is not open for joining');
      }

      // Count current players inside transaction
      const currentPlayers = await tx
        .select()
        .from(matchPlayers)
        .where(eq(matchPlayers.matchId, matchId));

      if (currentPlayers.find((p) => p.userId === userId)) {
        throw new ConflictException('Already joined this match');
      }

      if (currentPlayers.length >= (match.max_players as number)) {
        throw new BadRequestException('Match is full');
      }

      // Insert player
      await tx.insert(matchPlayers).values({ matchId, userId });

      const newCount = currentPlayers.length + 1;
      const full = newCount >= (match.max_players as number);

      // If full, update status inside transaction
      if (full) {
        await tx
          .update(matches)
          .set({ status: 'full', updatedAt: new Date() })
          .where(eq(matches.id, matchId));
      }

      return { count: newCount, isFull: full, maxPlayers: match.max_players as number };
    });

    // AFTER transaction: emit gateway events (non-blocking)
    this.gatewayService.emitToMatch(matchId, 'playerJoined', {
      userId,
      matchId,
      count: playerCount,
    });

    // Push notification to match creator (joinNotify preference)
    const [match] = await this.db.select({ creatorId: matches.creatorId, courtName: matches.courtName }).from(matches).where(eq(matches.id, matchId));
    if (match && match.creatorId !== userId) {
      const [creator] = await this.db.select({ joinNotify: users.joinNotify }).from(users).where(eq(users.id, match.creatorId));
      if (creator?.joinNotify !== false) {
        const [joiner] = await this.db.select({ name: users.name }).from(users).where(eq(users.id, userId));
        this.notifications.sendToUser(
          match.creatorId,
          'Nuevo jugador ⚽',
          `${joiner?.name ?? 'Un jugador'} se unió a tu partido en ${match.courtName}`,
          { matchId, screen: `/match/${matchId}` },
        );
      }
    }

    if (isFull) {
      this.gatewayService.emitToMatch(matchId, 'matchFull', { matchId });
      this.gatewayService.emitToMatch(matchId, 'matchStatusChanged', {
        matchId,
        status: 'full',
      });
      this.logger.log(`Match ${matchId} is full (${playerCount}/${maxPlayers})`);

      // Notify all players that match is full
      const allPlayers = await this.db
        .select({ userId: matchPlayers.userId })
        .from(matchPlayers)
        .where(eq(matchPlayers.matchId, matchId));
      const courtName = match?.courtName ?? 'la cancha';
      for (const p of allPlayers) {
        this.notifications.sendToUser(
          p.userId,
          'Partido completo 🔥',
          `Tu partido en ${courtName} está lleno. Equipos próximamente.`,
          { matchId, screen: `/match/${matchId}` },
        );
      }

      // Trigger matchmaking draft when match is full
      await this.matchmakingProducer.addDraftJob(matchId);
    }

    return { matchId, userId, count: playerCount };
  }

  async leave(matchId: string, userId: string) {
    const { remainingCount, wasReopened } = await this.db.transaction(async (tx) => {
      // Lock the match row to prevent concurrent leave/join conflicts
      const [match] = await tx.execute(
        sql`SELECT * FROM matches WHERE id = ${matchId} FOR UPDATE`,
      );
      if (!match) {
        throw new NotFoundException('Match not found');
      }

      if (['playing', 'voting', 'completed', 'drafting'].includes(match.status as string)) {
        throw new BadRequestException('No puedes salir de un partido en curso');
      }

      const result = await tx
        .delete(matchPlayers)
        .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.userId, userId)))
        .returning();

      if (result.length === 0) {
        throw new NotFoundException('Player not in this match');
      }

      // Get updated count inside transaction
      const remaining = await tx
        .select()
        .from(matchPlayers)
        .where(eq(matchPlayers.matchId, matchId));

      // If match was full, re-open it inside transaction
      let reopened = false;
      if (match.status === 'full') {
        await tx
          .update(matches)
          .set({ status: 'open', updatedAt: new Date() })
          .where(eq(matches.id, matchId));
        reopened = true;
      }

      return { remainingCount: remaining.length, wasReopened: reopened };
    });

    // AFTER transaction: emit gateway events (non-blocking)
    this.gatewayService.emitToMatch(matchId, 'playerLeft', {
      userId,
      matchId,
      count: remainingCount,
    });

    if (wasReopened) {
      this.gatewayService.emitToMatch(matchId, 'matchStatusChanged', {
        matchId,
        status: 'open',
      });
    }

    return { matchId, userId, count: remainingCount };
  }
}
