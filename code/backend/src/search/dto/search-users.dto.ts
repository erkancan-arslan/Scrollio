import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchUsersDto {
  @IsString()
  query: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  limit?: number = 20;
}

export interface UserSearchResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  level: number;
  xp: number;
  friendship_status: 'none' | 'pending' | 'accepted' | 'rejected' | 'blocked';
}

export interface SearchUsersResponse {
  users: UserSearchResult[];
  total: number;
}
