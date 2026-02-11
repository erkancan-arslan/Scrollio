/**
 * Kids Profile Feature Types
 * Type definitions for child profiles, topics, learning history, and metrics
 */

export interface KidsProfile {
  id: string;
  parentUserId: string;
  displayName: string;
  avatarUrl: string | null;
  avatarConfig: Record<string, unknown>;
  ageGroup: string;
  dateOfBirth: string | null;
  level: number;
  xp: number;
  streakDays: number;
  longestStreak: number;
  totalWatchTime: number;
  totalQuizzesCompleted: number;
  averageQuizScore: number;
  selectedTopicIds: string[];
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KidsTopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconUrl: string | null;
  color: string;
  parentTopicId: string | null;
  contentCount: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface KidsLearningHistory {
  id: string;
  childProfileId: string;
  contentId: string;
  contentTitle: string;
  contentThumbnailUrl: string;
  topicName: string;
  watchedSeconds: number;
  totalSeconds: number;
  quizScore: number | null;
  xpEarned: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KidsMetrics {
  id: string;
  childProfileId: string;
  totalVideosWatched: number;
  totalWatchTimeSeconds: number;
  totalQuizzesTaken: number;
  averageQuizScore: number;
  topicsExplored: number;
  currentLevel: number;
  currentXp: number;
  xpToNextLevel: number;
  currentStreak: number;
  longestStreak: number;
  favoriteTopicId: string | null;
  favoriteTopicName: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  updatedAt: string;
}
