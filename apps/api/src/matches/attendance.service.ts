import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { matchPlayers, matches, users } from '../database/schema';
import { eq, and, sql, lt } from 'drizzle-orm';
import { NotificationsService } from '../notifications/notifications.service';

const NO_SHOW_PENALTY = 50;

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Player confirms attendance (2h before match)
   */
  async confirmAttendance(matchId: string, userId: string) {
    const [player] = await this.db
      .select()
      .from(matchPlayers)
      .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.userId, userId)));

    if (!player) throw new BadRequestException('No estás en este partido');

    await this.db
      .update(matchPlayers)
      .set({ confirmed: true, confirmedAt: new Date() })
      .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.userId, userId)));

    return { confirmed: true };
  }

  /**
   * Send confirmation reminders for matches starting in ~2 hours
   * Called by a scheduled BullMQ job
   */
  async sendConfirmationReminders() {
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const twoHoursTenMin = new Date(now.getTime() + 2.17 * 60 * 60 * 1000);

    // Find matches starting in ~2 hours that are still 'full' or 'open'
    const upcomingMatches = await this.db
      .select()
      .from(matches)
      .where(
        and(
          sql`${matches.dateTime} BETWEEN ${twoHoursFromNow.toISOString()} AND ${twoHoursTenMin.toISOString()}`,
          sql`${matches.status} IN ('open', 'full')`,
        ),
      );

    for (const match of upcomingMatches) {
      // Get unconfirmed players
      const unconfirmed = await this.db
        .select({ userId: matchPlayers.userId })
        .from(matchPlayers)
        .where(
          and(
            eq(matchPlayers.matchId, match.id),
            eq(matchPlayers.confirmed, false),
          ),
        );

      for (const player of unconfirmed) {
        await this.notifications.sendToUser(
          player.userId,
          '¿Vas a ir? ⚽',
          `Tu partido en ${match.courtName} empieza en 2 horas. Confirma tu asistencia.`,
          { matchId: match.id, screen: `/match/${match.id}` },
        );
      }

      this.logger.log(`Sent ${unconfirmed.length} reminders for match ${match.id}`);
    }
  }

  /**
   * Process no-shows after a match was supposed to start
   * Called 30 min after match time
   */
  async processNoShows(matchId: string) {
    const noShows = await this.db
      .select({ userId: matchPlayers.userId })
      .from(matchPlayers)
      .where(
        and(
          eq(matchPlayers.matchId, matchId),
          eq(matchPlayers.confirmed, false),
          eq(matchPlayers.noShow, false),
        ),
      );

    for (const player of noShows) {
      // Mark as no-show
      await this.db
        .update(matchPlayers)
        .set({ noShow: true })
        .where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.userId, player.userId)));

      // Penalize MMR
      await this.db
        .update(users)
        .set({
          mmr: sql`GREATEST(${users.mmr} - ${NO_SHOW_PENALTY}, 0)`,
          noShowCount: sql`${users.noShowCount} + 1`,
          reliabilityBadge: false,
        })
        .where(eq(users.id, player.userId));

      // Notify
      await this.notifications.sendToUser(
        player.userId,
        'No-show registrado ⚠️',
        `No confirmaste asistencia. Penalización: -${NO_SHOW_PENALTY} MMR.`,
      );

      this.logger.warn(`No-show: user ${player.userId} for match ${matchId}, -${NO_SHOW_PENALTY} MMR`);
    }

    // Update reliability badges for reliable players
    // Badge = last 10 matches all confirmed
    const confirmedPlayers = await this.db
      .select({ userId: matchPlayers.userId })
      .from(matchPlayers)
      .where(
        and(
          eq(matchPlayers.matchId, matchId),
          eq(matchPlayers.confirmed, true),
        ),
      );

    for (const player of confirmedPlayers) {
      const [stats] = await this.db
        .select({ noShowCount: users.noShowCount, matchesPlayed: users.matchesPlayed })
        .from(users)
        .where(eq(users.id, player.userId));

      if (stats && stats.matchesPlayed >= 10 && stats.noShowCount === 0) {
        await this.db
          .update(users)
          .set({ reliabilityBadge: true })
          .where(eq(users.id, player.userId));
      }
    }
  }
}
