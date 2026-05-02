/**
 * Core Quiz API client
 *
 * Wraps the `/feed/quiz/*` endpoints that back the Core app's per-topic
 * level-up quizzes. See backend `code/backend/src/feed/quiz/*`.
 */

import { apiClient, ApiResponse } from '../api/apiClient';

export type QuizLevel = 'beginner' | 'intermediate';
export type VideoDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface QuizStatus {
  currentLevel: VideoDifficulty;
  pendingQuizLevel: QuizLevel | null;
  hasQuestions: boolean;
  autoUnlocked?: boolean;
}

export interface QuizQuestionPublic {
  questionId: string;
  videoId: string;
  question: string;
  options: string[];
  /** Pool exhausted — client should dismiss the overlay and refetch feed. */
  autoUnlock?: boolean;
  unlockedLevel?: VideoDifficulty;
}

export interface QuizSubmitResult {
  correct: boolean;
  explanation?: string;
  unlockedLevel?: VideoDifficulty;
  /** Same as `unlockedLevel` when the answer was correct (API spec alias). */
  nextLevel?: VideoDifficulty;
  xpAwarded?: number;
  newXp?: number;
  newLevel?: number;
  levelUp?: boolean;
}

class CoreQuizApi {
  async getStatus(topic: string): Promise<ApiResponse<QuizStatus>> {
    const qs = new URLSearchParams({ topic }).toString();
    return apiClient.get<QuizStatus>(`/feed/quiz/status?${qs}`, true);
  }

  async getNextQuestion(
    topic: string,
    level: QuizLevel,
  ): Promise<ApiResponse<QuizQuestionPublic>> {
    const qs = new URLSearchParams({ topic, level }).toString();
    return apiClient.get<QuizQuestionPublic>(`/feed/quiz/next-question?${qs}`, true);
  }

  async submit(input: {
    topic: string;
    level: QuizLevel;
    questionId: string;
    videoId: string;
    selectedAnswer: number;
  }): Promise<ApiResponse<QuizSubmitResult>> {
    return apiClient.post<QuizSubmitResult>('/feed/quiz/submit', input, true);
  }
}

export const coreQuizApi = new CoreQuizApi();
