import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MatchGateway } from './match.gateway';
import { GatewayService } from './gateway.service';

@Module({
  imports: [JwtModule.register({})],
  providers: [MatchGateway, GatewayService],
  exports: [GatewayService],
})
export class GatewayModule {}
