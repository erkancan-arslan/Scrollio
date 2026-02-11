/**
 * Kids Progression API Service
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

interface ProgressResponse {
  level: number;
  currentXp: number;
  xpToNextLevel: number;
  progressPercentage: number;
  progressMap: Record<string, unknown>;
}

interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  current: number;
  xpReward: number;
}

interface DailyMissionsResponse {
  date: string;
  missions: DailyMission[];
  completed: string[];
}

interface CompleteMissionResponse {
  completed: boolean;
  xpEarned: number;
  allMissionsCompleted: boolean;
}

/** GET /api/v1/kids/progression */
export const getProgress = async (): Promise<KidsApiResponse<ProgressResponse>> => {
  return kidsApi.get<ProgressResponse>('/kids/progression');
};

/** GET /api/v1/kids/progression/missions/daily */
export const getDailyMissions = async (): Promise<KidsApiResponse<DailyMissionsResponse>> => {
  return kidsApi.get<DailyMissionsResponse>('/kids/progression/missions/daily');
};

/** POST /api/v1/kids/progression/missions/:id/complete */
export const completeMissionApi = async (
  id: string,
): Promise<KidsApiResponse<CompleteMissionResponse>> => {
  return kidsApi.post<CompleteMissionResponse>(`/kids/progression/missions/${id}/complete`, {});
};

/** GET /api/v1/kids/progression/rewards */
export const getRewards = async (): Promise<KidsApiResponse<unknown[]>> => {
  return kidsApi.get<unknown[]>('/kids/progression/rewards');
};
