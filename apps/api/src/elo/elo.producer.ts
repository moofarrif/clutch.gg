import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class EloProducer {
  constructor(@InjectQueue('elo') private readonly queue: Queue) {}

  async addEloJob(matchId: string, result: 'team_a' | 'team_b') {
    return this.queue.add('calculate', { matchId, result }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 1000 },

      removeOnComplete: { age: 3600, count: 100 },
      removeOnFail: { age: 86400, count: 500 },
    });
  }
}
