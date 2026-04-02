
import { GameDefinition, GameConfig } from '../../platform/types';
import { InfiniteFlowState } from './types';
import { InfiniteFlowScreen } from './InfiniteFlowScreen';

export const InfiniteFlowGame: GameDefinition<InfiniteFlowState> = {
    id: 'infinite_flow',
    title: 'Infinite Flow',
    description: 'Tinder-style rapid fire knowledge.',
    categories: ['infinite', 'core', 'kids'],
    modes: ['single'],
    minPlayers: 1,
    maxPlayers: 1,

    createInitialState: (config: GameConfig) => ({
        score: 0,
        streak: 0,
        lives: config.initialLives || 3, // Default to 3 lives
        currentQuestionIndex: 0,
        language: 'en',
        shuffledQuestionsSeed: Date.now()
    }),

    getScore: (state) => state.score,

    isGameOver: (state) => state.lives <= 0,

    leaderboard: {
        boardId: 'infinite_flow',
        sortOrder: 'DESC',
        label: 'High Score'
    },

    UI: {
        Screen: InfiniteFlowScreen
    }
};
