import { IsString, IsOptional, IsEnum, IsBoolean, IsObject } from 'class-validator';

export enum AgeGroup {
  CHILD = '7-12',
  TEEN = '13-17',
  YOUNG_ADULT = '18-24',
  ADULT_25 = '25-34',
  ADULT_35 = '35-44',
  ADULT_45 = '45+',
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsEnum(AgeGroup)
  ageGroup?: AgeGroup;

  @IsOptional()
  @IsObject()
  preferences?: {
    notifications?: boolean;
    darkMode?: boolean;
    autoPlay?: boolean;
    /** Per-topic difficulty. Key = topic id, value = beginner | intermediate | advanced */
    topicDifficulties?: Record<string, 'beginner' | 'intermediate' | 'advanced'>;
    preferredTopics?: string[];
  };
}

export class ProfileDto {
  id: string;
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  ageGroup: string | null;
  level: number;
  xp: number;
  /** Scrollio playground balance (`scrollio_coins_ledger`). */
  playgroundCoins: number;
  totalVideosWatched: number;
  totalWatchTime: number;
  totalQuizzesCompleted: number;
  averageQuizScore: number;
  streakDays: number;
  longestStreak: number;
  lastActiveDate: string | null;
  preferences: {
    notifications: boolean;
    darkMode: boolean;
    autoPlay: boolean;
    topicDifficulties: Record<string, 'beginner' | 'intermediate' | 'advanced'>;
    preferredTopics: string[];
  };
  isCreator: boolean;
  isVerified: boolean;
  isPremium: boolean;
  followerCount: number;
  followingCount: number;
  isFollowing?: boolean; // Only when viewing other profiles
  createdAt: string;
}

export class PublicProfileDto {
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

export class FollowResponseDto {
  success: boolean;
  message: string;
  followerCount: number;
}

export class XpResponseDto {
  success: boolean;
  xpAdded: number;
  newXp: number;
  newLevel: number;
  levelUp: boolean;
}

export class StreakResponseDto {
  success: boolean;
  streakDays: number;
  streakMaintained: boolean;
}

export class TopicBreakdownDto {
  topic: string;
  videosWatched: number;
  percentage: number;
}

export class WeeklyAnalyticsDto {
  weekStart: string;
  videosWatched: number;
  totalWatchTimeSeconds: number;
  quizAccuracy: number | null;
  quizAttempts: number;
  topicDistribution: TopicBreakdownDto[];
}

