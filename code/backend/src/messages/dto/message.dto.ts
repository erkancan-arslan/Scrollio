import {
  IsString,
  IsUUID,
  IsOptional,
  IsIn,
  IsInt,
  Min,
  Max,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file' | 'post';

export class SendMessageDto {
  // Optional because shared posts may have no caption.
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsIn(['text', 'image', 'video', 'audio', 'file', 'post'])
  messageType?: MessageType = 'text';

  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  // Structured payload for non-text messages. For 'post' messages this
  // carries { videoId, title, creatorName, creatorAvatar, duration } so the
  // chat bubble can render a rich preview without an extra request.
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class EditMessageDto {
  @IsString()
  content: string;
}

export class GetMessagesDto {
  // Without @Type(() => Number), query strings stay as strings and @IsInt()
  // rejects them with a 400 — which is what made the chat screen render empty
  // even though the messages exist (the inbox uses an RPC and is unaffected).
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
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
  metadata: Record<string, any> | null;
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
