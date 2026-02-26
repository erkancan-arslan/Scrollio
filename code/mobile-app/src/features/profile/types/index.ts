/**
 * Profile Feature Types
 * Type definitions for user profiles, stats, and interactions
 */

export enum AgeGroup {
  CHILD = '7-12',
  TEEN = '13-17',
  YOUNG_ADULT = '18-24',
  ADULT_25 = '25-34',
  ADULT_35 = '35-44',
  ADULT_45 = '45+',
}

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ProfilePreferences {
  notifications: boolean;
  darkMode: boolean;
  autoPlay: boolean;
  /** Per-topic difficulty level. Key = topic id, value = difficulty. */
  topicDifficulties: Record<string, DifficultyLevel>;
  preferredTopics: string[];
}

export interface Profile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  ageGroup: string | null;
  level: number;
  xp: number;
  totalVideosWatched: number;
  totalWatchTime: number; // in seconds
  totalQuizzesCompleted: number;
  averageQuizScore: number;
  streakDays: number;
  longestStreak: number;
  lastActiveDate: string | null;
  preferences: ProfilePreferences;
  isCreator: boolean;
  isVerified: boolean;
  isPremium: boolean;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean; // Only when viewing other profiles
  createdAt: string;
}

export interface PublicProfile {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  level: number;
  xp: number;
  totalVideosWatched: number;
  streakDays: number;
  isCreator: boolean;
  isVerified: boolean;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean;
}

export interface UpdateProfileData {
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  ageGroup?: AgeGroup;
  preferences?: Partial<ProfilePreferences>;
}

export interface FollowResponse {
  success: boolean;
  message: string;
  followerCount: number;
}

export interface XpResponse {
  success: boolean;
  xpAdded: number;
  newXp: number;
  newLevel: number;
  levelUp: boolean;
}

export interface StreakResponse {
  success: boolean;
  streakDays: number;
  streakMaintained: boolean;
}

export type ProfileTab = 'bookmarks' | 'likes' | 'watched';
