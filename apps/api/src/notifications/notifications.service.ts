import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DRIZZLE } from '../database/database.provider';
import type { DrizzleDB } from '../database/database.provider';
import { matchPlayers, users } from '../database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectQueue('notifications') private readonly queue: Queue,
    @Inject(DRIZZLE) private readonly db: DrizzleDB,
  ) {}

  async sendToUser(userId: string, title: string, body: string, data?: Record<string, unknown>) {
    const [user] = await this.db
      .select({ expoPushToken: users.expoPushToken })
      .from(users)
      .where(eq(users.id, userId));

    if (!user?.expoPushToken) {
      this.logger.warn(`No push token for user ${userId}`);
      return;
    }

    return this.queue.add('push', {
      pushToken: user.expoPushToken,
      title,
      body,
      data,
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },

      removeOnComplete: { age: 3600, count: 100 },
      removeOnFail: { age: 86400, count: 500 },
    });
  }

  async sendToMatch(matchId: string, title: string, body: string, data?: Record<string, unknown>) {
    const players = await this.db
      .select({
        userId: matchPlayers.userId,
        expoPushToken: users.expoPushToken,
      })
      .from(matchPlayers)
      .innerJoin(users, eq(matchPlayers.userId, users.id))
      .where(eq(matchPlayers.matchId, matchId));

    const jobOpts = {
      attempts: 3,
      backoff: { type: 'exponential' as const, delay: 1000 },

      removeOnComplete: { age: 3600, count: 100 },
      removeOnFail: { age: 86400, count: 500 },
    };

    const jobs = players
      .filter((p) => p.expoPushToken)
      .map((p) => ({
        name: 'push',
        data: { pushToken: p.expoPushToken, title, body, data: { matchId, ...data } },
        opts: jobOpts,
      }));

    if (jobs.length > 0) {
      return this.queue.addBulk(jobs);
    }
  }
}
