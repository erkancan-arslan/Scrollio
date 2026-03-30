/**
 * Kids Feed Feature Types
 * Type definitions for kids content feed, quizzes, and view tracking
 */

export interface KidsContent {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: number;
  topicId: string;
  topicName: string;
  ageGroupMin: number;
  ageGroupMax: number;
  /** Null when content has no difficulty tier (e.g. admin-generated kids videos). */
  difficultyLevel: 'easy' | 'medium' | 'hard' | null;
  tags: string[];
  viewCount: number;
  likeCount: number;
  bookmarkCount: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KidsFeedItem {
  id: string;
  contentId: string;
  content: KidsContent;
  isLiked: boolean;
  isBookmarked: boolean;
  hasQuiz: boolean;
  quizCompleted: boolean;
  watchedSeconds: number;
  totalSeconds: number;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface KidsQuiz {
  id: string;
  contentId: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  xpReward: number;
  createdAt: string;
  updatedAt: string;
}

export interface KidsQuizAttempt {
  id: string;
  quizId: string;
  childProfileId: string;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  xpEarned: number;
  attemptedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ViewEvent {
  id: string;
  contentId: string;
  childProfileId: string;
  watchedSeconds: number;
  totalSeconds: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
