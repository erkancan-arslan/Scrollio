
export interface InfiniteFlowState {
    score: number;
    streak: number;
    lives: number;
    currentQuestionIndex: number; // Index in the shuffled array
    currentQuestionId?: string;   // For analytics/tracking
    language: 'en' | 'tr';
    shuffledQuestionsSeed: number; // Seed to deterministic shuffle
}
