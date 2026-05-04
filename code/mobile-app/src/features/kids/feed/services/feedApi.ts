/**
 * Kids feed — uses `/kids/feed` (kids_content) with X-Child-Profile-Id; not the core `/feed`.
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

interface KidsFeedApiRow {
  id: string;
  title: string;
  description?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  age_group?: string;
  difficulty?: string | null;
  topic_tags?: string[];
  duration_seconds?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  isBookmarked?: boolean;
  hasQuiz?: boolean;
  isLiked?: boolean;
}

export type KidsFeedEmptyReason = 'no_mascot' | 'no_topics' | 'no_matching_content';

interface KidsFeedHttpBody {
  data: KidsFeedApiRow[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    emptyReason?: KidsFeedEmptyReason;
  };
}

/** Normalised shape expected by feedSlice */
interface FeedItem {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  age_group: string;
  difficulty: string | null;
  topic_tags: string[];
  duration_seconds: number;
  is_active: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  hasQuiz: boolean;
  created_at: string;
  view_count?: number;
  like_count?: number;
  bookmark_count?: number;
}

interface FeedResponse {
  data: FeedItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
    emptyReason?: KidsFeedEmptyReason;
  };
}

interface TrackViewResponse {
  tracked: boolean;
  xpEarned: number;
  completed: boolean;
  playgroundPointsAwarded?: number;
  playgroundPoints?: number;
}

function mapRow(r: KidsFeedApiRow): FeedItem {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? null,
    video_url: r.video_url ?? null,
    thumbnail_url: r.thumbnail_url ?? null,
    age_group: r.age_group ?? '7-9',
    difficulty: r.difficulty ?? null,
    topic_tags: (r.topic_tags ?? []) as string[],
    duration_seconds: r.duration_seconds ?? 0,
    is_active: r.is_active ?? true,
    isLiked: r.isLiked ?? false,
    isBookmarked: r.isBookmarked ?? false,
    hasQuiz: r.hasQuiz ?? false,
    created_at: r.created_at ?? '',
  };
}

/**
 * GET /api/v1/kids/feed?page=&limit=&topicId=
 * Requires X-Child-Profile-Id (set by kidsApi).
 */
export const getFeed = async (
  page: number,
  limit: number,
  topicId?: string,
): Promise<KidsApiResponse<FeedResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (topicId) params.set('topicId', topicId);

  const res = await kidsApi.get<KidsFeedHttpBody | { videos?: unknown[]; nextCursor?: unknown }>(
    `/kids/feed?${params.toString()}`,
  );
  if (res.error || !res.data) {
    return { data: null, error: res.error, status: res.status };
  }

  const body = res.data as Record<string, unknown>;
  // Core `/feed` returns { videos, nextCursor, hasMore } — if we see that, base URL or route is wrong.
  if (Array.isArray(body.videos) && !Array.isArray(body.data)) {
    return {
      data: null,
      error:
        'Received main app feed shape. Set EXPO_PUBLIC_API_BASE_URL to include /api/v1 (e.g. http://HOST:PORT/api/v1) and reload.',
      status: res.status,
    };
  }

  const items = ((body.data as KidsFeedApiRow[]) ?? []).map(mapRow);
  const meta = (body.meta as KidsFeedHttpBody['meta']) ?? {
    page,
    limit,
    total: items.length,
    hasMore: false,
  };

  return {
    data: {
      data: items,
      meta,
    },
    error: null,
    status: res.status,
  };
};

/**
 * POST /api/v1/kids/feed/viewed
 */
export const trackView = async (
  contentId: string,
  watchedSeconds: number,
): Promise<KidsApiResponse<TrackViewResponse>> => {
  return kidsApi.post<TrackViewResponse>(`/kids/feed/viewed`, {
    contentId,
    watchedSeconds,
  });
};
