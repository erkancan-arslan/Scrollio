import { IsUUID, IsOptional } from 'class-validator';

export class CreateConversationDto {
  @IsUUID()
  friendId: string;
}

export interface ConversationResponse {
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

export interface ConversationListResponse {
  conversations: ConversationResponse[];
  total: number;
}

export class MarkAsReadDto {
  @IsUUID()
  conversationId: string;
}
