import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto';

@Controller('conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  /**
   * Get all user's conversations
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getConversations(@Request() req: any) {
    const userId = req.user.id;
    return this.conversationsService.getUserConversations(userId);
  }

  /**
   * Create or get conversation with a friend
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConversation(
    @Body() createDto: CreateConversationDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    return this.conversationsService.createOrGetConversation(
      userId,
      createDto.friendId,
    );
  }

  /**
   * Get specific conversation
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async getConversation(@Param('id') conversationId: string, @Request() req: any) {
    const userId = req.user.id;
    return this.conversationsService.getConversation(userId, conversationId);
  }

  /**
   * Mark conversation as read
   */
  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  async markAsRead(@Param('id') conversationId: string, @Request() req: any) {
    const userId = req.user.id;
    return this.conversationsService.markConversationAsRead(userId, conversationId);
  }

  /**
   * Delete/leave conversation
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteConversation(@Param('id') conversationId: string, @Request() req: any) {
    const userId = req.user.id;
    return this.conversationsService.deleteConversation(userId, conversationId);
  }

  /**
   * Get total unread count
   */
  @Get('unread/count')
  @HttpCode(HttpStatus.OK)
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.id;
    const count = await this.conversationsService.getTotalUnreadCount(userId);
    return { unreadCount: count };
  }
}
