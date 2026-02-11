/**
 * Kids Parental Feature Types
 * Type definitions for activity logs, screen time, content filters, and parental settings
 */

export interface KidsActivityLog {
  id: string;
  childProfileId: string;
  activityType: 'watch' | 'quiz' | 'draw' | 'explore' | 'login' | 'logout';
  contentId: string | null;
  contentTitle: string | null;
  topicName: string | null;
  durationSeconds: number;
  metadata: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface KidsScreenTimeRule {
  id: string;
  childProfileId: string;
  dailyLimitMinutes: number;
  weekdayStartTime: string;
  weekdayEndTime: string;
  weekendStartTime: string;
  weekendEndTime: string;
  isEnabled: boolean;
  breakIntervalMinutes: number;
  breakDurationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface KidsContentFilter {
  id: string;
  childProfileId: string;
  allowedTopicIds: string[];
  blockedTopicIds: string[];
  maxDifficultyLevel: 'easy' | 'medium' | 'hard';
  safeSearchEnabled: boolean;
  ageRestriction: number;
  customBlockedKeywords: string[];
  isEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KidsParentalSettings {
  id: string;
  parentUserId: string;
  pinHash: string;
  pinEnabled: boolean;
  screenTimeRules: KidsScreenTimeRule[];
  contentFilters: KidsContentFilter[];
  activityNotificationsEnabled: boolean;
  weeklyReportEnabled: boolean;
  dataRetentionDays: number;
  createdAt: string;
  updatedAt: string;
}
