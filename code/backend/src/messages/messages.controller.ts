import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { MessagesService } from './messages.service';
import { SendMessageDto, EditMessageDto, GetMessagesDto } from './dto';

const resolveAccessToken = (req: any): string => {
  if (req.supabaseAccessToken) {
    return req.supabaseAccessToken;
  }

  const authHeader: string | undefined = req.headers?.authorization;
  if (!authHeader) {
    throw new UnauthorizedException('Authorization header is required');
  }

  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) {
    throw new UnauthorizedException('Invalid authorization header format');
  }

  return token;
};

@Controller('conversations/:conversationId/messages')
@UseGuards(AuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Get messages for a conversation
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getMessages(
    @Param('conversationId') conversationId: string,
    @Query() query: GetMessagesDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const accessToken = resolveAccessToken(req);
    return this.messagesService.getMessages(
      userId,
      conversationId,
      query.limit,
      query.cursor,
      accessToken,
    );
  }

  /**
   * Send a message
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Body() sendDto: SendMessageDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const accessToken = resolveAccessToken(req);
    return this.messagesService.sendMessage(
      userId,
      conversationId,
      sendDto.content,
      sendDto.messageType,
      sendDto.mediaUrl,
      sendDto.thumbnailUrl,
      sendDto.metadata,
      accessToken,
    );
  }
}

@Controller('messages')
@UseGuards(AuthGuard)
export class MessageActionsController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * Edit a message
   */
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async editMessage(
    @Param('id') messageId: string,
    @Body() editDto: EditMessageDto,
    @Request() req: any,
  ) {
    const userId = req.user.id;
    const accessToken = resolveAccessToken(req);
    return this.messagesService.editMessage(
      userId,
      messageId,
      editDto.content,
      accessToken,
    );
  }

  /**
   * Delete a message
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteMessage(@Param('id') messageId: string, @Request() req: any) {
    const userId = req.user.id;
    const accessToken = resolveAccessToken(req);
    return this.messagesService.deleteMessage(userId, messageId, accessToken);
  }
}
