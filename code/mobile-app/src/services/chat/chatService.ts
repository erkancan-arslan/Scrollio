/**
 * Chat Service
 * Handles conversations and messages
 */

import { apiClient } from '../api/apiClient';

// Types
export interface Conversation {
  conversation_id: string;
  conversation_type: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_sender_id: string | null;
  unread_count: number;
  other_user_id: string | null;
  other_user_display_name: string | null;
  other_user_avatar_url: string | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: string;
  media_url: string | null;
  thumbnail_url: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    display_name: string;
    avatar_url: string;
  };
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
  nextCursor: string | null;
}

/**
 * Chat Service
 */
class ChatService {
  /**
   * Get all user conversations
   */
  async getConversations(): Promise<{
    success: boolean;
    data?: ConversationsResponse;
    error?: string;
  }> {
    const response = await apiClient.get<ConversationsResponse>('/conversations');

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch conversations',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * Create or get conversation with a friend
   */
  async createOrGetConversation(friendId: string): Promise<{
    success: boolean;
    data?: { conversation: Conversation };
    error?: string;
  }> {
    const response = await apiClient.post<{ success: boolean; conversation: Conversation }>(
      '/conversations',
      { friendId },
    );

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to create conversation',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(
    conversationId: string,
    limit: number = 50,
    cursor?: string,
  ): Promise<{
    success: boolean;
    data?: MessagesResponse;
    error?: string;
  }> {
    let url = `/conversations/${conversationId}/messages?limit=${limit}`;
    if (cursor) {
      url += `&cursor=${cursor}`;
    }

    const response = await apiClient.get<MessagesResponse>(url);

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to fetch messages',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * Send a message
   */
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: string = 'text',
    mediaUrl?: string,
  ): Promise<{
    success: boolean;
    data?: { message: Message };
    error?: string;
  }> {
    const response = await apiClient.post<{ success: boolean; message: Message }>(
      `/conversations/${conversationId}/messages`,
      {
        content,
        messageType,
        mediaUrl,
      },
    );

    if (response.error || !response.data) {
      return {
        success: false,
        error: response.error || 'Failed to send message',
      };
    }

    return {
      success: true,
      data: response.data,
    };
  }

  /**
   * Edit a message
   */
  async editMessage(
    messageId: string,
    content: string,
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await apiClient.patch<any>(`/messages/${messageId}`, {
      content,
    });

    if (response.error) {
      return {
        success: false,
        error: response.error || 'Failed to edit message',
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await apiClient.delete<any>(`/messages/${messageId}`);

    if (response.error) {
      return {
        success: false,
        error: response.error || 'Failed to delete message',
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Mark conversation as read
   */
  async markConversationAsRead(conversationId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await apiClient.post<any>(
      `/conversations/${conversationId}/read`,
      {},
    );

    if (response.error) {
      return {
        success: false,
        error: response.error || 'Failed to mark as read',
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Delete conversation
   */
  async deleteConversation(conversationId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    const response = await apiClient.delete<any>(`/conversations/${conversationId}`);

    if (response.error) {
      return {
        success: false,
        error: response.error || 'Failed to delete conversation',
      };
    }

    return {
      success: true,
    };
  }

  /**
   * Get total unread count
   */
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ unreadCount: number }>(
      '/conversations/unread/count',
    );

    if (response.error || !response.data) {
      return 0;
    }

    return response.data.unreadCount || 0;
  }
}

export const chatService = new ChatService();
