import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EloProducer } from './elo.producer';
import { EloProcessor } from './elo.processor';
import { EloListener } from './elo.listener';
import { GatewayModule } from '../gateway/gateway.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'elo' }),
    GatewayModule,
    NotificationsModule,
  ],
  providers: [EloProducer, EloProcessor, EloListener],
  exports: [EloProducer],
})
export class EloModule {}
