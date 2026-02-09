import { IsUUID, IsIn, IsOptional } from 'class-validator';

export class SendFriendRequestDto {
  @IsUUID()
  friendId: string;
}

export class RespondFriendRequestDto {
  @IsUUID()
  friendshipId: string;

  @IsIn(['accepted', 'rejected'])
  status: 'accepted' | 'rejected';
}

export class RemoveFriendDto {
  @IsUUID()
  friendshipId: string;
}

export interface FriendProfile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  last_active_date: string | null;
  friendship_id: string;
  created_at: string;
}

export interface PendingRequest {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  requested_at: string;
  friendship_id: string;
}

export interface FriendsListResponse {
  friends: FriendProfile[];
  total: number;
}

export interface PendingRequestsResponse {
  requests: PendingRequest[];
  total: number;
}
