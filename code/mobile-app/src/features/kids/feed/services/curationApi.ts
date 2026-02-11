/**
 * Kids Curation API Service
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

interface RecommendationItem {
  id: string;
  title: string;
  video_url: string | null;
  thumbnail_url: string | null;
  topic_tags: string[];
  score: number;
}

interface RecommendationResponse {
  data: RecommendationItem[];
  meta: { total: number };
}

/** GET /api/v1/kids/curation/recommendations */
export const getRecommendations = async (
  limit = 20,
  ageGroup?: string,
): Promise<KidsApiResponse<RecommendationResponse>> => {
  const params = new URLSearchParams();
  params.set('limit', String(limit));
  if (ageGroup) params.set('ageGroup', ageGroup);
  return kidsApi.get<RecommendationResponse>(
    `/kids/curation/recommendations?${params.toString()}`,
  );
};
