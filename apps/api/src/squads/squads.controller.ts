import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SquadsService } from './squads.service';

@ApiTags('Squads')
@Controller('squads')
export class SquadsController {
  constructor(private readonly squadsService: SquadsService) {}

  @Post()
  @ApiBearerAuth()
  create(
    @CurrentUser('sub') userId: string,
    @Body() body: { name: string; tag?: string },
  ) {
    return this.squadsService.create(userId, body.name, body.tag);
  }

  @Get()
  @Public()
  findAll(@Query('limit') limit?: string) {
    return this.squadsService.findAll(Number(limit) || 20);
  }

  @Get('me')
  @ApiBearerAuth()
  getMySquad(@CurrentUser('sub') userId: string) {
    return this.squadsService.getMySquad(userId);
  }

  @Get('invites/me')
  @ApiBearerAuth()
  getMyInvites(@CurrentUser('sub') userId: string) {
    return this.squadsService.getMyInvites(userId);
  }

  @Get(':id')
  @Public()
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.squadsService.findById(id);
  }

  @Get(':id/invites')
  @ApiBearerAuth()
  getPendingInvites(@Param('id', ParseUUIDPipe) id: string) {
    return this.squadsService.getPendingSquadInvites(id);
  }

  @Get(':id/requests')
  @ApiBearerAuth()
  getSquadRequests(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.squadsService.getSquadRequests(id, userId);
  }

  @Post(':id/join')
  @ApiBearerAuth()
  join(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.squadsService.join(id, userId);
  }

  @Post(':id/invite')
  @ApiBearerAuth()
  inviteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
    @Body() body: { userId: string },
  ) {
    return this.squadsService.inviteUser(id, userId, body.userId);
  }

  @Post(':id/request')
  @ApiBearerAuth()
  requestToJoin(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.squadsService.requestToJoin(id, userId);
  }

  @Post('invites/:id/accept')
  @ApiBearerAuth()
  acceptInvite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.squadsService.acceptInvite(id, userId);
  }

  @Delete('invites/:id/reject')
  @ApiBearerAuth()
  rejectInvite(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.squadsService.rejectInvite(id, userId);
  }

  @Delete(':id/members/:userId')
  @ApiBearerAuth()
  kickMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('userId', ParseUUIDPipe) memberId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.squadsService.kickMember(id, userId, memberId);
  }

  @Delete(':id/leave')
  @ApiBearerAuth()
  leave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.squadsService.leave(id, userId);
  }
}
