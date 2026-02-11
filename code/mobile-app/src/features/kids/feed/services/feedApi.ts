/**
 * Kids Feed API Service
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

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
  isBookmarked: boolean;
  hasQuiz: boolean;
  created_at: string;
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

/** GET /api/v1/kids/feed?page=&limit=&topicId= */
export const getFeed = async (
  page: number,
  limit: number,
  topicId?: string,
): Promise<KidsApiResponse<FeedResponse>> => {
  const params = new URLSearchParams();
  params.set('page', String(page));
  params.set('limit', String(limit));
  if (topicId) params.set('topicId', topicId);
  return kidsApi.get<FeedResponse>(`/kids/feed?${params.toString()}`);
};

/** POST /api/v1/kids/feed/viewed */
export const trackView = async (
  contentId: string,
  watchedSeconds: number,
): Promise<KidsApiResponse<TrackViewResponse>> => {
  return kidsApi.post<TrackViewResponse>('/kids/feed/viewed', {
    contentId,
    watchedSeconds,
  });
};
