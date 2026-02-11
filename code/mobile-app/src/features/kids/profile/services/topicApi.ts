/**
 * Kids Topic API Service
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

interface Topic {
  id: string;
  name: string;
  icon_url: string | null;
  category: string;
  is_active: boolean;
}

/** GET /api/v1/kids/profile/topics */
export const getTopics = async (): Promise<KidsApiResponse<Topic[]>> => {
  return kidsApi.get<Topic[]>('/kids/profile/topics');
};

/** GET /api/v1/kids/profile/topics/search?q=query */
export const searchTopics = async (
  query: string,
): Promise<KidsApiResponse<Topic[]>> => {
  return kidsApi.get<Topic[]>(`/kids/profile/topics/search?q=${encodeURIComponent(query)}`);
};

/** GET /api/v1/kids/profile/topics/selected */
export const getSelectedTopics = async (): Promise<KidsApiResponse<Topic[]>> => {
  return kidsApi.get<Topic[]>('/kids/profile/topics/selected');
};

/** POST /api/v1/kids/profile/topics/select */
export const selectTopics = async (
  topicIds: string[],
): Promise<KidsApiResponse<Topic[]>> => {
  return kidsApi.post<Topic[]>('/kids/profile/topics/select', { topicIds });
};
