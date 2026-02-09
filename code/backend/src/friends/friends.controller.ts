import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Param,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { FriendsService } from './friends.service';
import {
  SendFriendRequestDto,
  RespondFriendRequestDto,
  RemoveFriendDto,
} from './dto';

@Controller('friends')
@UseGuards(AuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * Get list of friends
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getFriends(@Request() req: any) {
    const userId = req.user.id;
    return this.friendsService.getFriendsList(userId);
  }

  /**
   * Get pending friend requests (received)
   */
  @Get('requests/pending')
  @HttpCode(HttpStatus.OK)
  async getPendingRequests(@Request() req: any) {
    const userId = req.user.id;
    return this.friendsService.getPendingRequests(userId);
  }

  /**
   * Get sent friend requests
   */
  @Get('requests/sent')
  @HttpCode(HttpStatus.OK)
  async getSentRequests(@Request() req: any) {
    const userId = req.user.id;
    return this.friendsService.getSentRequests(userId);
  }

  /**
   * Send a friend request
   */
  @Post('request')
  @HttpCode(HttpStatus.CREATED)
  async sendFriendRequest(
    @Body() sendRequestDto: SendFriendRequestDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.friendsService.sendFriendRequest(userId, sendRequestDto.friendId);
  }

  /**
   * Accept or reject a friend request
   */
  @Patch('request/:friendshipId')
  @HttpCode(HttpStatus.OK)
  async respondToFriendRequest(
    @Param('friendshipId') friendshipId: string,
    @Body() respondDto: RespondFriendRequestDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.friendsService.respondToFriendRequest(
      userId,
      friendshipId,
      respondDto.status,
    );
  }

  /**
   * Remove a friend or cancel a request
   */
  @Delete(':friendshipId')
  @HttpCode(HttpStatus.OK)
  async removeFriend(
    @Param('friendshipId') friendshipId: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.friendsService.removeFriend(userId, friendshipId);
  }
}
