/**
 * Types for the Feed feature
 * Matches backend DTOs from code/backend/src/feed/dto/feed-response.dto.ts
 */

export interface VideoCreator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isVerified: boolean;
}

export interface VideoStats {
  views: number;
  likes: number;
  comments: number;
  bookmarks: number;
  shares: number;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number; // in seconds
  creator: VideoCreator;
  stats: VideoStats;
  topic: string;
  topicId: string | null;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  color: string | null;
  videoCount: number;
}

export interface FeedResponse {
  videos: Video[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface TopicsResponse {
  topics: Topic[];
}

export interface ActionResponse {
  success: boolean;
  message: string;
  likeCount?: number;
  bookmarkCount?: number;
}

export interface FeedQueryParams {
  limit?: number;
  cursor?: string;
  topicId?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface FeedState {
  videos: Video[];
  currentIndex: number;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  nextCursor: string | null;
  hasMore: boolean;
}

