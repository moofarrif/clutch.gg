import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { MatchmakingProducer } from './matchmaking.producer';
import { MatchmakingProcessor } from './matchmaking.processor';
import { GatewayModule } from '../gateway/gateway.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'matchmaking' }),
    GatewayModule,
    NotificationsModule,
  ],
  providers: [MatchmakingProducer, MatchmakingProcessor],
  exports: [MatchmakingProducer],
})
export class MatchmakingModule {}
