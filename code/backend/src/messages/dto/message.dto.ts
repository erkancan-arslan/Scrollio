import { IsString, IsUUID, IsOptional, IsIn, IsInt, Min } from 'class-validator';

export class SendMessageDto {
  @IsString()
  content: string;

  @IsOptional()
  @IsIn(['text', 'image', 'video', 'audio', 'file'])
  messageType?: 'text' | 'image' | 'video' | 'audio' | 'file' = 'text';

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class EditMessageDto {
  @IsString()
  content: string;
}

export class GetMessagesDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsUUID()
  cursor?: string; // Last message ID for pagination
}

export interface MessageResponse {
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

export interface MessagesListResponse {
  messages: MessageResponse[];
  hasMore: boolean;
  nextCursor: string | null;
}
