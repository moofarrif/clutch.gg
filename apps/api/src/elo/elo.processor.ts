import { Inject, Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { matchPlayers, matches, users, eloHistory } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { calculateElo, getRankForMmr } from '@clutch/shared';
import { GatewayService } from '../gateway/gateway.service';
import { NotificationsService } from '../notifications/notifications.service';

@Processor('elo', { concurrency: 1 })
export class EloProcessor extends WorkerHost {
  private readonly logger = new Logger(EloProcessor.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly gatewayService: GatewayService,
    private readonly notifications: NotificationsService,
  ) {
    super();
  }

  async process(job: Job<{ matchId: string; result: 'team_a' | 'team_b' }>) {
    try {
      const { matchId, result } = job.data;
      this.logger.log(`Processing ELO for match ${matchId}, result: ${result}`);

      // 1. Fetch match players with their MMR
      const players = await this.db
        .select({
          userId: matchPlayers.userId,
          team: matchPlayers.team,
          mmr: users.mmr,
          matchesPlayed: users.matchesPlayed,
          wins: users.wins,
          losses: users.losses,
        })
        .from(matchPlayers)
        .innerJoin(users, eq(matchPlayers.userId, users.id))
        .where(eq(matchPlayers.matchId, matchId));

      // 2. Calculate avg MMR per team
      const teamA = players.filter((p) => p.team === 'A');
      const teamB = players.filter((p) => p.team === 'B');

      const avgMmrA = teamA.reduce((sum, p) => sum + p.mmr, 0) / (teamA.length || 1);
      const avgMmrB = teamB.reduce((sum, p) => sum + p.mmr, 0) / (teamB.length || 1);

      const winningTeam = result === 'team_a' ? 'A' : 'B';

      // 3-7. Update each player in a transaction
      await this.db.transaction(async (tx) => {
        for (const player of players) {
          const isTeamA = player.team === 'A';
          const opponentAvgMmr = isTeamA ? avgMmrB : avgMmrA;
          const won = player.team === winningTeam;

          // 3. Calculate new ELO
          const newMmr = calculateElo(
            player.mmr,
            opponentAvgMmr,
            won,
            player.matchesPlayed,
          );

          // 4. Update users.mmr
          // 6. Update users.wins/losses/matches_played
          // 7. Update rank
          const rank = getRankForMmr(newMmr);
          await tx
            .update(users)
            .set({
              mmr: newMmr,
              matchesPlayed: sql`${users.matchesPlayed} + 1`,
              wins: won ? sql`${users.wins} + 1` : users.wins,
              losses: won ? users.losses : sql`${users.losses} + 1`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, player.userId));

          // 5. Insert elo_history row
          await tx.insert(eloHistory).values({
            userId: player.userId,
            matchId,
            mmrBefore: player.mmr,
            mmrAfter: newMmr,
          });
        }

        // 8. Update match status → 'completed'
        await tx
          .update(matches)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(matches.id, matchId));
      });

      // 9. Emit matchResult via GatewayService
      this.gatewayService.emitToMatch(matchId, 'matchResult', {
        matchId,
        result,
      });

      // 10. Push notifications to each player
      for (const player of players) {
        const won = player.team === winningTeam;
        const isTeamA = player.team === 'A';
        const opponentAvgMmr = isTeamA ? avgMmrB : avgMmrA;
        const newMmr = calculateElo(player.mmr, opponentAvgMmr, won, player.matchesPlayed);
        const delta = newMmr - player.mmr;
        const sign = delta >= 0 ? '+' : '';

        const oldRank = getRankForMmr(player.mmr);
        const newRank = getRankForMmr(newMmr);
        const rankedUp = newRank.minMmr > oldRank.minMmr;

        if (rankedUp) {
          // Rank up notification
          this.notifications.sendToUser(
            player.userId,
            `Subiste a ${newRank.label}! 🏆`,
            `${newMmr} MMR (${sign}${delta}). ¡Sigue así!`,
            { matchId, screen: `/match/${matchId}` },
          );
        } else {
          // Regular result notification
          this.notifications.sendToUser(
            player.userId,
            won ? 'Victoria! ⚽' : 'Derrota 😔',
            `${sign}${delta} MMR → ${newMmr} MMR`,
            { matchId, screen: `/match/${matchId}` },
          );
        }
      }

      this.logger.log(`ELO calculation complete for match ${matchId}`);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }
}
