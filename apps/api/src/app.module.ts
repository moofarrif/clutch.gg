import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { LoggerModule } from 'nestjs-pino';
import { DatabaseModule } from './database/database.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MatchesModule } from './matches/matches.module';
import { MatchmakingModule } from './matchmaking/matchmaking.module';
import { VotingModule } from './voting/voting.module';
import { EloModule } from './elo/elo.module';
import { ConductModule } from './conduct/conduct.module';
import { GatewayModule } from './gateway/gateway.module';
import { ConfigParamsModule } from './config-params/config-params.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FriendsModule } from './friends/friends.module';
import { SquadsModule } from './squads/squads.module';
import { CourtsModule } from './courts/courts.module';
import { StorageModule } from './storage/storage.module';
import { EventBusModule } from './common/events/event-bus.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    // Config (.env)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV ?? 'development'}`,
        '.env',
      ],
    }),

    // Logging
    LoggerModule.forRoot({
      pinoHttp: {
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // BullMQ
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { host: 'localhost', port: Number(config.get('REDIS_PORT', 6380)) },
      }),
    }),

    // Infrastructure
    EventBusModule,
    DatabaseModule,
    RedisModule,
    StorageModule,

    // Feature modules
    AuthModule,
    UsersModule,
    ConfigParamsModule,
    MatchesModule,
    MatchmakingModule,
    VotingModule,
    EloModule,
    ConductModule,
    GatewayModule,
    NotificationsModule,
    FriendsModule,
    SquadsModule,
    CourtsModule,
    HealthModule,
  ],
})
export class AppModule {}
