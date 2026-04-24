import { Controller, Get, Inject } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { DRIZZLE } from '../database/database.provider';
import { REDIS } from '../redis/redis.module';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    @Inject(REDIS) private readonly redis: any,
  ) {}

  @Get()
  @Public()
  async check() {
    const checks: Record<string, string> = {};

    try {
      await this.db.execute(sql`SELECT 1`);
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    try {
      await this.redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'error';
    }

    const healthy = Object.values(checks).every(v => v === 'ok');
    return { status: healthy ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() };
  }
}
