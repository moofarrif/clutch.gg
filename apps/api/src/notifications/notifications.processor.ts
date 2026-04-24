import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Expo, type ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

interface PushJobData {
  pushToken: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Processor('notifications', { concurrency: 5 })
export class NotificationsProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationsProcessor.name);

  async process(job: Job<PushJobData>) {
    const { pushToken, title, body, data } = job.data;

    try {
      if (!Expo.isExpoPushToken(pushToken)) {
        this.logger.warn(`Invalid push token: ${pushToken}`);
        return;
      }

      const message: ExpoPushMessage = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data ?? {},
        priority: 'high',
        channelId: 'default',
      };

      const [ticket] = await expo.sendPushNotificationsAsync([message]);

      if (ticket.status === 'ok') {
        this.logger.log(`Push sent: "${title}" → ${pushToken.slice(0, 20)}...`);
      } else if (ticket.status === 'error') {
        this.logger.error(`Push error: ${ticket.message} (${ticket.details?.error})`);
        // If token is invalid, it should be removed from the user
        if (ticket.details?.error === 'DeviceNotRegistered') {
          this.logger.warn(`Device not registered, token should be removed: ${pushToken}`);
        }
      }
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }
}
