/**
 * Kids Parental API Service
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

interface ActivityLogEntry {
  id: string;
  child_profile_id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ActivityResponse {
  data: ActivityLogEntry[];
  meta: { page: number; limit: number; total: number };
}

interface ScreenTimeResponse {
  dailyLimitMinutes: number;
  usedMinutesToday: number;
  remainingMinutes: number;
  allowedStartTime: string;
  allowedEndTime: string;
  isLimitReached: boolean;
}

interface ContentFiltersResponse {
  blockedTopicIds: string[];
  maxDifficulty: string;
  safeSearchEnabled: boolean;
}

/** GET /api/v1/kids/parental/activity */
export const getActivity = async (): Promise<KidsApiResponse<ActivityResponse>> => {
  return kidsApi.get<ActivityResponse>('/kids/parental/activity');
};

/** GET /api/v1/kids/parental/screen-time */
export const getScreenTime = async (): Promise<KidsApiResponse<ScreenTimeResponse>> => {
  return kidsApi.get<ScreenTimeResponse>('/kids/parental/screen-time');
};

/** PATCH /api/v1/kids/parental/screen-time */
export const updateScreenTime = async (
  data: { dailyLimitMinutes: number; allowedStartTime?: string; allowedEndTime?: string },
): Promise<KidsApiResponse<ScreenTimeResponse>> => {
  return kidsApi.patch<ScreenTimeResponse>('/kids/parental/screen-time', data);
};

/** GET /api/v1/kids/parental/content-filters */
export const getContentFilters = async (): Promise<KidsApiResponse<ContentFiltersResponse>> => {
  return kidsApi.get<ContentFiltersResponse>('/kids/parental/content-filters');
};

/** PATCH /api/v1/kids/parental/content-filters */
export const updateContentFilters = async (
  data: Partial<{ blockedTopicIds: string[]; maxDifficulty: string; safeSearchEnabled: boolean }>,
): Promise<KidsApiResponse<ContentFiltersResponse>> => {
  return kidsApi.patch<ContentFiltersResponse>('/kids/parental/content-filters', data);
};
