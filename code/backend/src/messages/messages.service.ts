import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { MessageResponse, MessagesListResponse } from './dto';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get messages for a conversation
   */
  async getMessages(
    userId: string,
    conversationId: string,
    limit: number = 50,
    cursor?: string,
    accessToken?: string,
  ): Promise<MessagesListResponse> {
    try {
      // Use admin client for validation (bypasses RLS, prevents recursion)
      const supabaseAdmin = this.supabaseService.getAdminClient();
      
      // Verify user is a participant using admin client
      const { data: participant, error: participantError } = await supabaseAdmin
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .single();

      if (participantError || !participant) {
        throw new ForbiddenException('Access denied to this conversation');
      }

      // Use regular client for actual operations (respects RLS)
      const supabase = this.getUserSupabaseClient(accessToken);

      // Build query - fetch messages without joins
      let query = supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(limit + 1); // Fetch one extra to check if there are more

      // Cursor-based pagination
      if (cursor) {
        const { data: cursorMessage } = await supabase
          .from('messages')
          .select('created_at')
          .eq('id', cursor)
          .single();

        if (cursorMessage) {
          query = query.lt('created_at', cursorMessage.created_at);
        }
      }

      const { data, error } = await query;

      if (error) {
        this.logger.error('Error fetching messages:', error);
        throw new Error(`Failed to fetch messages: ${error.message}`);
      }

      const messages = data || [];
      const hasMore = messages.length > limit;
      const messageList = hasMore ? messages.slice(0, limit) : messages;

      // Get next cursor (last message ID)
      const nextCursor = hasMore ? messageList[messageList.length - 1].id : null;

      // Fetch sender profiles for all messages
      const senderIds = [...new Set(messageList.map((msg: any) => msg.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', senderIds);

      // Create a map for quick lookup
      const profileMap = new Map(
        profiles?.map((p) => [p.id, p]) || [],
      );

      // Map to response format
      const formattedMessages: MessageResponse[] = messageList.map((msg: any) => {
        const senderProfile = profileMap.get(msg.sender_id);
        return {
          id: msg.id,
          conversation_id: msg.conversation_id,
          sender_id: msg.sender_id,
          content: msg.content,
          message_type: msg.message_type,
          media_url: msg.media_url,
          thumbnail_url: msg.thumbnail_url,
          metadata: msg.metadata ?? null,
          is_edited: msg.is_edited,
          is_deleted: msg.is_deleted,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          sender: senderProfile
            ? {
                id: senderProfile.id,
                display_name: senderProfile.display_name,
                avatar_url: senderProfile.avatar_url,
              }
            : undefined,
        };
      });

      return {
        messages: formattedMessages,
        hasMore,
        nextCursor,
      };
    } catch (error) {
      this.logger.error('Get messages error:', error);
      throw error;
    }
  }

  /**
   * Send a message
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    content: string | null | undefined,
    messageType: string = 'text',
    mediaUrl?: string,
    thumbnailUrl?: string,
    metadata?: Record<string, any>,
    accessToken?: string,
  ) {
    try {
      // Use admin client for validation (bypasses RLS, prevents recursion)
      const supabaseAdmin = this.supabaseService.getAdminClient();
      
      // Verify user is a participant using admin client
      const { data: participant, error: participantError } = await supabaseAdmin
        .from('conversation_participants')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)
        .single();

      if (participantError || !participant) {
        this.logger.warn(`Access denied: User ${userId} not in conversation ${conversationId}`);
        throw new ForbiddenException('Access denied to this conversation');
      }

      // Use regular client for actual operations (respects RLS)
      const supabase = this.getUserSupabaseClient(accessToken);
      
      // Create message
      const { data: message, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: userId,
          content: content ?? null,
          message_type: messageType,
          media_url: mediaUrl,
          thumbnail_url: thumbnailUrl,
          metadata: metadata ?? null,
        })
        .select('*')
        .single();

      if (error) {
        this.logger.error('Error sending message:', error);
        throw new Error(`Failed to send message: ${error.message}`);
      }

      // Fetch sender profile separately
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('id', userId)
        .single();

      // Format response
      const formattedMessage: MessageResponse = {
        id: message.id,
        conversation_id: message.conversation_id,
        sender_id: message.sender_id,
        content: message.content,
        message_type: message.message_type,
        media_url: message.media_url,
        thumbnail_url: message.thumbnail_url,
        metadata: message.metadata ?? null,
        is_edited: message.is_edited,
        is_deleted: message.is_deleted,
        created_at: message.created_at,
        updated_at: message.updated_at,
        sender: senderProfile
          ? {
              id: senderProfile.id,
              display_name: senderProfile.display_name,
              avatar_url: senderProfile.avatar_url,
            }
          : undefined,
      };

      // TODO: Send FCM notification to other participants
      // This will be implemented in the FCM module

      return {
        success: true,
        message: formattedMessage,
      };
    } catch (error) {
      this.logger.error('Send message error:', error);
      throw error;
    }
  }

  /**
   * Edit a message
   */
  async editMessage(
    userId: string,
    messageId: string,
    content: string,
    accessToken?: string,
  ) {
    try {
      const supabase = this.getUserSupabaseClient(accessToken);

      // Verify user owns the message
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .eq('sender_id', userId)
        .single();

      if (fetchError || !message) {
        throw new NotFoundException('Message not found or access denied');
      }

      // Update message
      const { data: updatedMessage, error } = await supabase
        .from('messages')
        .update({
          content,
          is_edited: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId)
        .select()
        .single();

      if (error) {
        this.logger.error('Error editing message:', error);
        throw new Error(`Failed to edit message: ${error.message}`);
      }

      return {
        success: true,
        message: updatedMessage,
      };
    } catch (error) {
      this.logger.error('Edit message error:', error);
      throw error;
    }
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(
    userId: string,
    messageId: string,
    accessToken?: string,
  ) {
    try {
      const supabase = this.getUserSupabaseClient(accessToken);

      // Verify user owns the message
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .eq('sender_id', userId)
        .single();

      if (fetchError || !message) {
        throw new NotFoundException('Message not found or access denied');
      }

      // Soft delete — wipe all payload fields so deleted shared posts can't
      // still be tapped to play in the chat bubble.
      const { error } = await supabase
        .from('messages')
        .update({
          is_deleted: true,
          content: null,
          media_url: null,
          thumbnail_url: null,
          metadata: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) {
        this.logger.error('Error deleting message:', error);
        throw new Error(`Failed to delete message: ${error.message}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Delete message error:', error);
      throw error;
    }
  }
  private getUserSupabaseClient(accessToken?: string) {
    if (!accessToken) {
      throw new UnauthorizedException('Missing Supabase access token');
    }
    return this.supabaseService.getClientWithAuth(accessToken);
  }
}
