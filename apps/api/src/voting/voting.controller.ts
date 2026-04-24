import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VotingService } from './voting.service';
import { VoteDto } from './dto/vote.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('matches')
export class VotingController {
  constructor(private readonly votingService: VotingService) {}

  @Post(':id/vote')
  @ApiBearerAuth()
  async vote(
    @Param('id', ParseUUIDPipe) matchId: string,
    @CurrentUser('sub') userId: string,
    @Body() dto: VoteDto,
  ) {
    return this.votingService.vote(matchId, userId, dto.vote, dto.scoreA, dto.scoreB);
  }

  @Get(':id/votes')
  @Public()
  async getVotes(@Param('id', ParseUUIDPipe) matchId: string) {
    return this.votingService.getVotes(matchId);
  }
}
