import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConversationResponse, ConversationListResponse } from './dto';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get all conversations for a user
   */
  async getUserConversations(userId: string): Promise<ConversationListResponse> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase.rpc('get_user_conversations', {
        requesting_user_id: userId,
      });

      if (error) {
        this.logger.error('Error fetching conversations:', error);
        throw new Error(`Failed to fetch conversations: ${error.message}`);
      }

      const conversations: ConversationResponse[] = data || [];

      return {
        conversations,
        total: conversations.length,
      };
    } catch (error) {
      this.logger.error('Get conversations error:', error);
      throw error;
    }
  }

  /**
   * Create or get existing direct conversation with a friend
   */
  async createOrGetConversation(userId: string, friendId: string) {
    try {
      const supabase = this.supabaseService.getClient();

      // Use the RPC function to create or get conversation
      const { data: conversationId, error } = await supabase.rpc(
        'get_or_create_direct_conversation',
        {
          user1_id: userId,
          user2_id: friendId,
        },
      );

      if (error) {
        this.logger.error('Error creating/getting conversation:', error);
        throw new Error(`Failed to create conversation: ${error.message}`);
      }

      // Fetch the conversation details
      const { data: conversations, error: fetchError } = await supabase.rpc(
        'get_user_conversations',
        {
          requesting_user_id: userId,
        },
      );

      if (fetchError) {
        this.logger.error('Error fetching conversation details:', fetchError);
        throw new Error(`Failed to fetch conversation: ${fetchError.message}`);
      }

      const conversation = conversations?.find(
        (c: ConversationResponse) => c.conversation_id === conversationId,
      );

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      return {
        success: true,
        conversation,
      };
    } catch (error) {
      this.logger.error('Create conversation error:', error);
      throw error;
    }
  }

  /**
   * Get conversation details
   */
  async getConversation(userId: string, conversationId: string) {
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
        throw new NotFoundException('Conversation not found or access denied');
      }

      // Use regular client for RPC calls (respects RLS)
      const supabase = this.supabaseService.getClient();
      
      // Get conversation details
      const { data: conversations, error } = await supabase.rpc(
        'get_user_conversations',
        {
          requesting_user_id: userId,
        },
      );

      if (error) {
        this.logger.error('Error fetching conversation:', error);
        throw new Error(`Failed to fetch conversation: ${error.message}`);
      }

      const conversation = conversations?.find(
        (c: ConversationResponse) => c.conversation_id === conversationId,
      );

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

      return conversation;
    } catch (error) {
      this.logger.error('Get conversation error:', error);
      throw error;
    }
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(userId: string, conversationId: string) {
    try {
      const supabase = this.supabaseService.getClient();

      const { error } = await supabase.rpc('mark_conversation_read', {
        requesting_user_id: userId,
        conv_id: conversationId,
      });

      if (error) {
        this.logger.error('Error marking conversation as read:', error);
        throw new Error(`Failed to mark as read: ${error.message}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Mark as read error:', error);
      throw error;
    }
  }

  /**
   * Delete/leave conversation
   */
  async deleteConversation(userId: string, conversationId: string) {
    try {
      const supabase = this.supabaseService.getClient();

      // Remove user from conversation participants
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', userId);

      if (error) {
        this.logger.error('Error deleting conversation:', error);
        throw new Error(`Failed to delete conversation: ${error.message}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Delete conversation error:', error);
      throw error;
    }
  }

  /**
   * Get total unread count for user
   */
  async getTotalUnreadCount(userId: string): Promise<number> {
    try {
      const supabase = this.supabaseService.getClient();

      const { data, error } = await supabase.rpc('get_unread_message_count', {
        requesting_user_id: userId,
      });

      if (error) {
        this.logger.error('Error fetching unread count:', error);
        return 0;
      }

      const total = data?.reduce(
        (sum: number, item: any) => sum + parseInt(item.unread_count || 0),
        0,
      );

      return total || 0;
    } catch (error) {
      this.logger.error('Get unread count error:', error);
      return 0;
    }
  }
}
