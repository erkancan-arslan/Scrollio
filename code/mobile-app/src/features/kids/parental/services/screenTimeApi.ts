/**
 * Kids Screen Time API — Thin wrappers around parentalApi screen time endpoints
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

interface ScreenTimeRules {
  dailyLimitMinutes: number;
  usedMinutesToday: number;
  remainingMinutes: number;
  allowedStartTime: string;
  allowedEndTime: string;
  isLimitReached: boolean;
}

/** GET /api/v1/kids/parental/screen-time */
export const getScreenTimeRules = async (): Promise<KidsApiResponse<ScreenTimeRules>> => {
  return kidsApi.get<ScreenTimeRules>('/kids/parental/screen-time');
};

/** PATCH /api/v1/kids/parental/screen-time */
export const updateScreenTimeRules = async (
  data: { dailyLimitMinutes: number; allowedStartTime?: string; allowedEndTime?: string },
): Promise<KidsApiResponse<ScreenTimeRules>> => {
  return kidsApi.patch<ScreenTimeRules>('/kids/parental/screen-time', data);
};
