import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ConductService } from './conduct.service';
import { RateConductDto } from './dto/conduct.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller()
export class ConductController {
  constructor(private readonly conductService: ConductService) {}

  @Post('matches/:id/rate')
  @ApiBearerAuth()
  async rate(
    @Param('id', ParseUUIDPipe) matchId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: RateConductDto,
  ) {
    return this.conductService.rate(matchId, userId, dto.ratings);
  }

  @Get('users/:id/conduct')
  @Public()
  async getUserConduct(@Param('id', ParseUUIDPipe) userId: string) {
    return this.conductService.getUserConductScore(userId);
  }
}
