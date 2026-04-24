import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleDB = ReturnType<typeof drizzle<typeof schema>>;

export const drizzleProvider: Provider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const client = postgres(config.getOrThrow<string>('DATABASE_URL'), {
      max: 20,
      idle_timeout: 30,
      max_lifetime: 30 * 60,
      connect_timeout: 10,
    });
    return drizzle(client, { schema });
  },
};
