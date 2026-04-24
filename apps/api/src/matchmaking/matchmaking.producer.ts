import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class MatchmakingProducer {
  constructor(@InjectQueue('matchmaking') private readonly queue: Queue) {}

  async addDraftJob(matchId: string) {
    return this.queue.add('draft', { matchId }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },

      removeOnComplete: { age: 3600, count: 100 },
      removeOnFail: { age: 86400, count: 500 },
    });
  }
}
