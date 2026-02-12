/**
 * Kids Feed API Service
 *
 * TEMPORARY: Points to the main /feed endpoint (which reads from the `videos`
 * table) so the kids UI can be tested while `kids_content` is still empty.
 * Revert to `/kids/feed` once kids content is available.
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

// ── Main-feed Video shape (matches backend VideoDto) ────────────────
interface MainFeedVideo {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  thumbnailUrl: string | null;
  duration: number;
  creator: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    isVerified: boolean;
  };
  stats: {
    views: number;
    likes: number;
    comments: number;
    bookmarks: number;
    shares: number;
  };
  topic: string;
  topicId: string | null;
  tags: string[];
  difficulty: string;
  isLiked: boolean;
  isBookmarked: boolean;
  createdAt: string;
}

interface MainFeedResponse {
  videos: MainFeedVideo[];
  nextCursor: string | null;
  hasMore: boolean;
}

// ── Normalised shape expected by feedSlice ───────────────────────────
interface FeedItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  age_group: string;
  difficulty: string;
  topic_tags: string[];
  duration_seconds: number;
  is_active: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  hasQuiz: boolean;
  created_at: string;
  // Extra fields carried through from main feed
  creator_username?: string;
  creator_display_name?: string;
  creator_avatar_url?: string | null;
  view_count?: number;
  like_count?: number;
  bookmark_count?: number;
}

interface FeedResponse {
  data: FeedItem[];
  meta: { page: number; limit: number; total: number; hasMore: boolean };
}

interface TrackViewResponse {
  tracked: boolean;
  xpEarned: number;
  completed: boolean;
}

// Keep a cursor for infinite-scroll across pages
let _nextCursor: string | null = null;

/**
 * GET /api/v1/feed  (main feed, temporarily)
 * Adapts main-feed cursor pagination into the page/meta shape the kids
 * feedSlice expects.
 */
export const getFeed = async (
  page: number,
  limit: number,
  _topicId?: string,
): Promise<KidsApiResponse<FeedResponse>> => {
  // Reset cursor when refreshing (page 1)
  if (page === 1) {
    _nextCursor = null;
  }

  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (_nextCursor) params.set('cursor', _nextCursor);

  const res = await kidsApi.get<MainFeedResponse>(`/feed?${params.toString()}`);

  if (res.error || !res.data) {
    return { data: null, error: res.error, status: res.status };
  }

  const mainData = res.data;
  _nextCursor = mainData.nextCursor;

  // Map main-feed Video → kids FeedItem shape
  const items: FeedItem[] = mainData.videos.map((v) => ({
    id: v.id,
    title: v.title,
    description: v.description,
    video_url: v.videoUrl,
    thumbnail_url: v.thumbnailUrl,
    age_group: '7-12',
    difficulty: v.difficulty,
    topic_tags: v.tags?.length ? v.tags : [v.topic],
    duration_seconds: v.duration,
    is_active: true,
    isLiked: v.isLiked,
    isBookmarked: v.isBookmarked,
    hasQuiz: false,
    created_at: v.createdAt,
    creator_username: v.creator?.username,
    creator_display_name: v.creator?.displayName,
    creator_avatar_url: v.creator?.avatarUrl,
    view_count: v.stats?.views ?? 0,
    like_count: v.stats?.likes ?? 0,
    bookmark_count: v.stats?.bookmarks ?? 0,
  }));

  const adapted: FeedResponse = {
    data: items,
    meta: {
      page,
      limit,
      total: items.length,
      hasMore: mainData.hasMore,
    },
  };

  return { data: adapted, error: null, status: res.status };
};

/**
 * POST /api/v1/feed/videos/:id/view  (main feed, temporarily)
 */
export const trackView = async (
  contentId: string,
  watchedSeconds: number,
): Promise<KidsApiResponse<TrackViewResponse>> => {
  const res = await kidsApi.post<{ success: boolean }>(
    `/feed/videos/${contentId}/view`,
    { watchDuration: watchedSeconds, completed: false },
  );
  return {
    data: { tracked: true, xpEarned: 0, completed: false },
    error: res.error,
    status: res.status,
  };
};
