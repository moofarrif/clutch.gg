import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ConfigParamsService } from './config-params.service';

@ApiTags('Config')
@Controller('config')
export class ConfigParamsController {
  constructor(private readonly configParamsService: ConfigParamsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all config parameters' })
  async getAll() {
    return this.configParamsService.getAll();
  }

  @Public()
  @Get(':key')
  @ApiOperation({ summary: 'Get a config parameter by key' })
  async getByKey(@Param('key') key: string) {
    const value = await this.configParamsService.get(key);
    if (value === undefined) {
      throw new NotFoundException(`Config key "${key}" not found`);
    }
    return { key, value };
  }
}
