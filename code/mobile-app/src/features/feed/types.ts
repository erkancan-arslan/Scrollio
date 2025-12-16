/**
 * Types for the Feed feature
 * Following brain/04-development/standards/coding-style.md
 */

export interface VideoCreator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  isVerified: boolean;
}

export interface VideoStats {
  views: number;
  likes: number;
  comments: number;
  bookmarks: number;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number; // in seconds
  creator: VideoCreator;
  stats: VideoStats;
  topic: string;
  tags: string[];
  createdAt: string;
  isLiked: boolean;
  isBookmarked: boolean;
}

export interface FeedState {
  videos: Video[];
  currentIndex: number;
  loading: boolean;
  error: string | null;
}

