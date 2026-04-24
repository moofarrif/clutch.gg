import { Global, Module } from '@nestjs/common';
import { ConfigParamsService } from './config-params.service';
import { ConfigParamsController } from './config-params.controller';

@Global()
@Module({
  controllers: [ConfigParamsController],
  providers: [ConfigParamsService],
  exports: [ConfigParamsService],
})
export class ConfigParamsModule {}
