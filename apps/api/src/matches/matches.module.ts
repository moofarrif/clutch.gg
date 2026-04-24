import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { MatchmakingModule } from '../matchmaking/matchmaking.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MatchesService } from './matches.service';
import { MatchJoinService } from './match-join.service';
import { MatchQueryService } from './match-query.service';
import { AttendanceService } from './attendance.service';
import { MatchesController } from './matches.controller';

@Module({
  imports: [GatewayModule, MatchmakingModule, NotificationsModule],
  controllers: [MatchesController],
  providers: [MatchesService, MatchJoinService, MatchQueryService, AttendanceService],
  exports: [MatchesService, MatchJoinService, MatchQueryService, AttendanceService],
})
export class MatchesModule {}
