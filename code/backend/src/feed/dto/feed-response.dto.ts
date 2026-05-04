export interface CreatorDto {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface VideoStatsDto {
  views: number;
  likes: number;
  comments: number;
  bookmarks: number;
  shares: number;
}

export interface VideoDto {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  creator: CreatorDto;
  stats: VideoStatsDto;
  topic: string;
  topicId: string | null;
  tags: string[];
  difficulty: string;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

export interface FeedResponseDto {
  videos: VideoDto[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface TopicDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  color: string | null;
  videoCount: number;
}

export interface TopicsResponseDto {
  topics: TopicDto[];
}

export interface ActionResponseDto {
  success: boolean;
  message: string;
  likeCount?: number;
  bookmarkCount?: number;
  xpAwarded?: number;
  newXp?: number;
  newLevel?: number;
  levelUp?: boolean;
  /** Playground currency from `scrollio_coins_ledger` (earned on first meaningful video watch). */
  coinsAwarded?: number;
  playgroundCoins?: number;
}

