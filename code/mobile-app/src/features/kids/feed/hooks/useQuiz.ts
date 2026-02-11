/**
 * useQuiz — Manages quiz state and answer submission
 */

import { KidsQuiz } from '../types/feed.types';

const asyncNoop = async () => {};

interface UseQuizReturn {
  currentQuiz: KidsQuiz | null;
  submitAnswer: (answerIndex: number) => Promise<void>;
  isLoading: boolean;
}

export const useQuiz = (): UseQuizReturn => {
  return {
    currentQuiz: null,
    submitAnswer: asyncNoop,
    isLoading: false,
  };
};
