import { Inject, Injectable, BadRequestException, Logger } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { matchVotes, matchPlayers, matches } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { EventBusService } from '../common/events/event-bus.service';
import { MatchResultConfirmedEvent } from '../common/events/match-events';
import { ConfigParamsService } from '../config-params/config-params.service';

@Injectable()
export class VotingService {
  private readonly logger = new Logger(VotingService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly eventBus: EventBusService,
    private readonly configParamsService: ConfigParamsService,
  ) {}

  async vote(matchId: string, userId: string, vote: 'team_a' | 'team_b', scoreA?: number, scoreB?: number) {
    const result = await this.db.transaction(async (tx) => {
      // Lock the match row to prevent concurrent threshold checks
      const [match] = await tx.execute(
        sql`SELECT * FROM matches WHERE id = ${matchId} FOR UPDATE`,
      );

      if (!match || match.status !== 'playing') {
        throw new BadRequestException('Match is not in playing status');
      }

      // Verify user is in match
      const [player] = await tx
        .select()
        .from(matchPlayers)
        .where(
          and(
            eq(matchPlayers.matchId, matchId),
            eq(matchPlayers.userId, userId),
          ),
        );

      if (!player) {
        throw new BadRequestException('User is not a player in this match');
      }

      // Insert vote (upsert)
      await tx
        .insert(matchVotes)
        .values({ matchId, userId, vote, scoreA, scoreB })
        .onConflictDoUpdate({
          target: [matchVotes.matchId, matchVotes.userId],
          set: { vote, scoreA, scoreB },
        });

      // Count votes inside transaction
      const votes = await tx
        .select({
          vote: matchVotes.vote,
          count: sql<number>`count(*)::int`,
        })
        .from(matchVotes)
        .where(eq(matchVotes.matchId, matchId))
        .groupBy(matchVotes.vote);

      const totalVotes = votes.reduce((sum, v) => sum + v.count, 0);
      const maxPlayers = (await this.configParamsService.get('max_players') as number) ?? 10;
      const voteThreshold = (await this.configParamsService.get('vote_threshold') as number) ?? 0.6;
      const threshold = Math.ceil(maxPlayers * voteThreshold);

      if (totalVotes < threshold) {
        return { resolved: false, votesCount: totalVotes };
      }

      // Determine winner by majority
      const teamAVotes = votes.find((v) => v.vote === 'team_a')?.count ?? 0;
      const teamBVotes = votes.find((v) => v.vote === 'team_b')?.count ?? 0;

      if (teamAVotes >= threshold || teamBVotes >= threshold) {
        const winner = teamAVotes >= teamBVotes ? 'team_a' : 'team_b';

        // Determine score from votes: find the most common score pair
        const scoreVotes = await tx
          .select({
            scoreA: matchVotes.scoreA,
            scoreB: matchVotes.scoreB,
            count: sql<number>`count(*)::int`,
          })
          .from(matchVotes)
          .where(
            and(
              eq(matchVotes.matchId, matchId),
              sql`${matchVotes.scoreA} IS NOT NULL AND ${matchVotes.scoreB} IS NOT NULL`,
            ),
          )
          .groupBy(matchVotes.scoreA, matchVotes.scoreB)
          .orderBy(sql`count(*) DESC`)
          .limit(1);

        const scoreResult = scoreVotes.length > 0
          ? `${scoreVotes[0].scoreA} - ${scoreVotes[0].scoreB}`
          : winner;

        // Update match result and status INSIDE transaction
        await tx
          .update(matches)
          .set({ result: scoreResult, status: 'completed', updatedAt: new Date() })
          .where(eq(matches.id, matchId));

        return { resolved: true, winner: winner as 'team_a' | 'team_b' };
      }

      return { resolved: false, votesCount: totalVotes };
    });

    // AFTER transaction: if resolved, queue ELO job (non-blocking)
    if (result.resolved && result.winner) {
      this.logger.log(`Threshold reached for match ${matchId}, result: ${result.winner}`);
      this.eventBus.emit('match.result.confirmed', new MatchResultConfirmedEvent(matchId, result.winner));
    }

    return { matchId, userId, vote };
  }

  async getVotes(matchId: string) {
    return this.db
      .select()
      .from(matchVotes)
      .where(eq(matchVotes.matchId, matchId));
  }
}
