
import { ReactNode } from 'react';

/**
 * Unique identifier for a game.
 * Add new game IDs here as they are migrated.
 */
export type GameId =
    | 'infinite_flow'
    | 'bil_ve_fethet_classroom';


export type GameMode = 'single' | 'hotseat' | 'multiplayer';

export interface GameConfig {
    mode?: GameMode;
    difficulty?: 'easy' | 'medium' | 'hard';
    seed?: number;
    wager?: number;
    initialLives?: number;
}

export interface BaseSession {
    sessionId: string;
    gameId: GameId;
    mode: GameMode;
    startedAt: number;
    config: GameConfig;
}

export interface GameResult {
    endedAt: number;
    score: number;
    normalizedScore?: number; // 0-100 or standardized for leaderboards
    outcome?: 'win' | 'loss' | 'draw';
    stats?: Record<string, any>;
}

/**
 * Interactive Game Contract
 */
export interface GameDefinition<TState, TConfig = GameConfig> {
    id: GameId;
    title: string;
    description: string;
    categories: ('infinite' | 'logic' | 'visual' | 'challenges')[];
    modes: GameMode[];
    minPlayers: number;
    maxPlayers: number;

    /**
     * Create the initial state for the game session.
     */
    createInitialState: (config: TConfig) => TState;

    /**
     * Calculate current score from state (for UI display).
     */
    getScore: (state: TState) => number;

    /**
     * Check if the game is over based on state.
     */
    isGameOver: (state: TState) => boolean;

    /**
     * Optional: Transform state into a result object when game ends.
     */
    getResult?: (state: TState) => GameResult;

    leaderboard?: {
        boardId: string;
        label?: string;
        sortOrder?: 'ASC' | 'DESC';
        formatScore?: (score: number) => string;
    };

    /**
     * UI Components
     */
    UI: {
        /**
         * The main game screen component.
         * Receives the session, current state, and dispatch function.
         */
        Screen: React.ComponentType<{
            session: BaseSession;
            state: TState;
            dispatchGameAction: (action: any) => void;
            onGameOver: (result: GameResult) => void;
            onExit: () => void;
        }>;

        /**
         * Optional: Tutorial or instructions modal content.
         */
        Tutorial?: React.ComponentType<any>;

        /**
         * Optional: Custom results view. If not provided, generic shell result view is used.
         */
        Results?: React.ComponentType<{
            result: GameResult;
            onPlayAgain: () => void;
            onExit: () => void;
        }>;
    };
}
