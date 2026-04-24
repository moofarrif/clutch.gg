import { Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { matchPlayers, matches, users } from '../database/schema';
import { eq, and } from 'drizzle-orm';
import { GatewayService } from '../gateway/gateway.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('matchmaking', { concurrency: 1 })
export class MatchmakingProcessor extends WorkerHost {
  private readonly logger = new Logger(MatchmakingProcessor.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly gatewayService: GatewayService,
    private readonly notificationsService: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<{ matchId: string }>) {
    try {
      const { matchId } = job.data;
      this.logger.log(`Processing draft for match ${matchId}`);

      // 1. Fetch players with MMR
      const players = await this.db
        .select({
          userId: matchPlayers.userId,
          mmr: users.mmr,
        })
        .from(matchPlayers)
        .innerJoin(users, eq(matchPlayers.userId, users.id))
        .where(eq(matchPlayers.matchId, matchId));

      if (players.length < 10) {
        this.logger.warn(`Match ${matchId} has only ${players.length} players, need 10`);
        return;
      }

      // 2. Set status to 'drafting' + notify clients
      await this.db.update(matches).set({ status: 'drafting', updatedAt: new Date() }).where(eq(matches.id, matchId));
      this.gatewayService.emitToMatch(matchId, 'matchStatusChanged', { matchId, status: 'drafting' });

      // 3. Sort by MMR desc
      players.sort((a, b) => b.mmr - a.mmr);

      // 4. Serpentine draft: [0]→A, [1]→B, [2]→B, [3]→A, [4]→A, [5]→B, [6]→B, [7]→A, [8]→A, [9]→B
      const serpentinePattern = ['A', 'B', 'B', 'A', 'A', 'B', 'B', 'A', 'A', 'B'] as const;

      // 5. Update match_players with team assignments
      await this.db.transaction(async (tx) => {
        for (let i = 0; i < players.length; i++) {
          await tx
            .update(matchPlayers)
            .set({ team: serpentinePattern[i] })
            .where(
              and(
                eq(matchPlayers.matchId, matchId),
                eq(matchPlayers.userId, players[i].userId),
              ),
            );
        }

        // 6. Update match status → 'playing'
        await tx
          .update(matches)
          .set({ status: 'playing', updatedAt: new Date() })
          .where(eq(matches.id, matchId));
      });

      // 7. Emit draftComplete + matchStatusChanged
      const teamA = players
        .filter((_, i) => serpentinePattern[i] === 'A')
        .map((p) => p.userId);
      const teamB = players
        .filter((_, i) => serpentinePattern[i] === 'B')
        .map((p) => p.userId);

      this.gatewayService.emitToMatch(matchId, 'draftComplete', { matchId, teamA, teamB });
      this.gatewayService.emitToMatch(matchId, 'matchStatusChanged', { matchId, status: 'playing' });

      // 8. Push notification to all players
      try {
        await this.notificationsService.sendToMatch(
          matchId,
          '¡Equipos asignados!',
          'Los equipos han sido sorteados. Ve tu equipo en el lobby.',
          { matchId },
        );
      } catch (e) {
        this.logger.warn(`Push notification failed for match ${matchId}: ${(e as Error).message}`);
      }

      this.logger.log(`Draft complete for match ${matchId}`);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }
}
