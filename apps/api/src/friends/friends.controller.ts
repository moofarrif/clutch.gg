import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { FriendsService } from './friends.service';

@ApiTags('Friends')
@ApiBearerAuth()
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('request')
  sendRequest(
    @CurrentUser('sub') userId: string,
    @Body('userId') addresseeId: string,
  ) {
    return this.friendsService.sendRequest(userId, addresseeId);
  }

  @Get()
  getFriends(@CurrentUser('sub') userId: string) {
    return this.friendsService.getFriends(userId);
  }

  @Get('requests')
  getPendingRequests(@CurrentUser('sub') userId: string) {
    return this.friendsService.getPendingRequests(userId);
  }

  @Post(':id/accept')
  acceptRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.friendsService.acceptRequest(id, userId);
  }

  @Post(':id/reject')
  rejectRequest(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.friendsService.rejectRequest(id, userId);
  }

  @Delete(':id')
  removeFriend(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.friendsService.removeFriend(id, userId);
  }
}
