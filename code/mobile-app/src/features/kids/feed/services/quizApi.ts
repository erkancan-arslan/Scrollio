/**
 * Kids Quiz API Service
 */

import { kidsApi, KidsApiResponse } from '../../shared/utils/api';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
}

interface QuizResponse {
  id: string;
  contentId: string;
  questions: QuizQuestion[];
  completed: boolean;
}

interface SubmitAnswerResponse {
  correct: boolean;
  score: number;
  xpEarned: number;
  playgroundPointsAwarded?: number;
  playgroundPoints?: number;
  correctAnswer: string;
  explanation: string | null;
}

/** GET /api/v1/kids/quiz/:contentId */
export const getQuiz = async (
  contentId: string,
): Promise<KidsApiResponse<QuizResponse>> => {
  return kidsApi.get<QuizResponse>(`/kids/quiz/${contentId}`);
};

/** POST /api/v1/kids/quiz/:quizId/submit */
export const submitAnswer = async (
  quizId: string,
  questionId: string,
  selectedAnswers: string[],
): Promise<KidsApiResponse<SubmitAnswerResponse>> => {
  return kidsApi.post<SubmitAnswerResponse>(`/kids/quiz/${quizId}/submit`, {
    questionId,
    selectedAnswers,
  });
};
