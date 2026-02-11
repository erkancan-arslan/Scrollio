/**
 * Kids Profile API Service
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

/** GET /api/v1/kids/profile */
export const getProfile = async (): Promise<KidsApiResponse<Record<string, unknown>>> => {
  return kidsApi.get('/kids/profile');
};

/** PATCH /api/v1/kids/profile */
export const updateProfile = async (
  data: { displayName?: string; language?: string },
): Promise<KidsApiResponse<Record<string, unknown>>> => {
  return kidsApi.patch('/kids/profile', data);
};

/** PATCH /api/v1/kids/profile/avatar */
export const updateAvatar = async (
  data: { avatarId: string; color?: string },
): Promise<KidsApiResponse<Record<string, unknown>>> => {
  return kidsApi.patch('/kids/profile/avatar', data);
};

/** GET /api/v1/kids/profile/history */
export const getHistory = async (): Promise<KidsApiResponse<unknown[]>> => {
  return kidsApi.get('/kids/profile/history');
};

/** GET /api/v1/kids/profile/metrics */
export const getMetrics = async (): Promise<
  KidsApiResponse<{
    level: number;
    currentXp: number;
    xpToNextLevel: number;
    totalVideosWatched: number;
    totalQuizzesTaken: number;
    totalBookmarks: number;
    totalRewards: number;
  }>
> => {
  return kidsApi.get('/kids/profile/metrics');
};
