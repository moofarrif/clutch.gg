import { Inject, Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { conductRatings, matchPlayers, matches, users } from '../database/schema';
import { eq, and, sql } from 'drizzle-orm';

@Injectable()
export class ConductService {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDB) {}

  async rate(
    matchId: string,
    raterId: string,
    ratings: { userId: string; score: number }[],
  ) {
    // Validate match is completed
    const [match] = await this.db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId));

    if (!match || match.status !== 'completed') {
      throw new BadRequestException('Match is not completed');
    }

    // Validate rater was in match
    const [raterPlayer] = await this.db
      .select()
      .from(matchPlayers)
      .where(
        and(
          eq(matchPlayers.matchId, matchId),
          eq(matchPlayers.userId, raterId),
        ),
      );

    if (!raterPlayer) {
      throw new BadRequestException('Rater was not a player in this match');
    }

    // Insert ratings in batch and recalculate averages efficiently
    await this.db.transaction(async (tx) => {
      // 1. Batch insert all ratings (upsert)
      const ratingsToInsert = ratings.map((rating) => ({
        matchId,
        raterId,
        ratedId: rating.userId,
        score: rating.score,
      }));

      for (const row of ratingsToInsert) {
        await tx
          .insert(conductRatings)
          .values(row)
          .onConflictDoUpdate({
            target: [conductRatings.matchId, conductRatings.raterId, conductRatings.ratedId],
            set: { score: row.score },
          });
      }

      // 2. Get unique rated user IDs
      const ratedUserIds = [...new Set(ratings.map((r) => r.userId))];

      // 3. Recalculate avg conduct score ONCE per rated user
      for (const ratedId of ratedUserIds) {
        const [result] = await tx
          .select({
            avgScore: sql<number>`avg(score)::real`,
          })
          .from(conductRatings)
          .where(eq(conductRatings.ratedId, ratedId));

        if (result?.avgScore != null) {
          await tx
            .update(users)
            .set({
              conductScore: result.avgScore,
              updatedAt: new Date(),
            })
            .where(eq(users.id, ratedId));
        }
      }
    });

    return { matchId, raterId, ratingsCount: ratings.length };
  }

  async getUserConductScore(userId: string) {
    const [user] = await this.db
      .select({ conductScore: users.conductScore })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) throw new NotFoundException('User not found');

    return { userId, conductScore: user.conductScore };
  }
}
