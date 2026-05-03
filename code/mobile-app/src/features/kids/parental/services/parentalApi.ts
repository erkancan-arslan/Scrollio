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

export interface MediaItem {
  id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  duration_seconds: number;
}

export interface MediaEngagementResponse {
  watched: MediaItem[];
  liked: MediaItem[];
  bookmarked: MediaItem[];
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

/** GET /api/v1/kids/parental/media-engagement */
export const getMediaEngagement = async (): Promise<KidsApiResponse<MediaEngagementResponse>> => {
  return kidsApi.get<MediaEngagementResponse>('/kids/parental/media-engagement');
};

export interface WatchTimeSummaryResponse {
  dailyMinutes: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
}

export interface QuizTopicPerformance {
  topic: string;
  attempts: number;
  avgScorePct: number;
}

/** GET /api/v1/kids/parental/watch-time-summary */
export const getWatchTimeSummary = async (): Promise<KidsApiResponse<WatchTimeSummaryResponse>> => {
  return kidsApi.get<WatchTimeSummaryResponse>('/kids/parental/watch-time-summary');
};

/** GET /api/v1/kids/parental/quiz-performance */
export const getQuizPerformance = async (): Promise<KidsApiResponse<QuizTopicPerformance[]>> => {
  return kidsApi.get<QuizTopicPerformance[]>('/kids/parental/quiz-performance');
};

export interface WeeklyReportResponse {
  weekLabel: string;
  watchMinutes: number;
  videosWatched: number;
  quizzesAttempted: number;
  activityBreakdown: Record<string, number>;
  quizTopics: QuizTopicPerformance[];
}

/** GET /api/v1/kids/parental/weekly-report */
export const getWeeklyReport = async (): Promise<KidsApiResponse<WeeklyReportResponse>> => {
  return kidsApi.get<WeeklyReportResponse>('/kids/parental/weekly-report');
};

export interface DailyProgressEntry {
  date: string;
  watchMinutes: number;
  quizAttempts: number;
  avgQuizScore: number;
  xpEarned: number;
  activitiesCount: number;
}

/** GET /api/v1/kids/parental/progress-history */
export const getProgressHistory = async (): Promise<KidsApiResponse<DailyProgressEntry[]>> => {
  return kidsApi.get<DailyProgressEntry[]>('/kids/parental/progress-history');
};
