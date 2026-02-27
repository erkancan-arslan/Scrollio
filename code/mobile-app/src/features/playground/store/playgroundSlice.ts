import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BaseSession, GameId, GameResult } from '../platform/types';
import { getGameDefinition, isGameRegistered } from '../platform/gameRegistry';
import { InfiniteFlowState } from '../games/infinite_flow/types';
import { ClassroomClientState } from '../games/bil-ve-fethet-classroom/types';
import { DuelSession, DuelStateSnapshot, DuelRequest, DuelConnectionStatus } from '../games/infinite_flow/duelTypes';

// Strict union for all supported games
export type GameStateUnion = InfiniteFlowState | ClassroomClientState;

export interface ActiveGameSession extends BaseSession {
    state: GameStateUnion;
    isGameOver: boolean;
    result?: GameResult;
}

interface PlaygroundState {
    activeSession: ActiveGameSession | null;
    wager: {
        isActive: boolean;
        amount: number;
        challengeId: string | null;
    } | null;
    // Duel state
    duelSession: DuelSession | null;
    incomingDuelRequest: DuelRequest | null;
}

const initialState: PlaygroundState = {
    activeSession: null,
    wager: null,
    duelSession: null,
    incomingDuelRequest: null,
};

const playgroundSlice = createSlice({
    name: 'playground',
    initialState,
    reducers: {
        startGame: (state, action: PayloadAction<{ gameId: GameId; config?: any }>) => {
            const { gameId, config } = action.payload;

            // 1. Check registry
            if (!isGameRegistered(gameId)) {
                console.error(`Game ${gameId} not registered! Cannot start session.`);
                return;
            }

            const def = getGameDefinition(gameId);
            const initialState = def.createInitialState(config || {});

            state.activeSession = {
                sessionId: Math.random().toString(36).substring(7),
                gameId,
                mode: config?.mode || 'single',
                startedAt: Date.now(),
                config: config || {},
                state: initialState,
                isGameOver: false
            };
        },

        // Generic action dispatch for game logic
        updateGameState: (state, action: PayloadAction<GameStateUnion>) => {
            if (state.activeSession && !state.activeSession.isGameOver) {
                state.activeSession.state = action.payload;
            }
        },

        // Standardized Answer Handling (Fix for Stale State / Race Conditions)
        submitAnswer: (state, action: PayloadAction<{ isCorrect: boolean }>) => {
            if (!state.activeSession || state.activeSession.isGameOver) return;

            // We assume Infinite Flow logic here since it's the only game.
            // In future, switch(state.activeSession.gameId) to handle others.
            const s = state.activeSession.state as InfiniteFlowState;

            if (action.payload.isCorrect) {
                s.score += 10;
                s.streak += 1;
                // Optional: Increment question index or difficulty here
            } else {
                s.streak = 0;
                s.lives = Math.max(0, s.lives - 1);

                if (s.lives <= 0) {
                    state.activeSession.isGameOver = true;
                    state.activeSession.result = {
                        endedAt: Date.now(),
                        score: s.score,
                        outcome: 'loss'
                    };
                }
            }
        },

        // Helper for language toggle
        toggleLanguage: (state) => {
            if (state.activeSession && !state.activeSession.isGameOver) {
                const s = state.activeSession.state as InfiniteFlowState;
                s.language = s.language === 'en' ? 'tr' : 'en';
            }
        },

        endGame: (state, action: PayloadAction<GameResult | undefined>) => {
            if (state.activeSession) {
                state.activeSession.isGameOver = true;
                if (action.payload) {
                    state.activeSession.result = action.payload;
                }
            }
        },

        // LEGACY ACTIONS ADAPTERS (Deprecated)
        incrementScore: (state, action: PayloadAction<number>) => {
            // ... kept for compatibility but should be replaced
        },
        resetStreak: (state) => {
            // ...
        },

        setWager: (state, action: PayloadAction<{ amount: number; challengeId: string }>) => {
            state.wager = {
                isActive: true,
                amount: action.payload.amount,
                challengeId: action.payload.challengeId,
            };
        },
        clearWager: (state) => {
            state.wager = null;
        },
        resetCurrentSession: (state) => {
            state.activeSession = null;
        },

        // ===================================================
        // DUEL REDUCERS
        // ===================================================

        startDuelSession: (state, action: PayloadAction<DuelSession>) => {
            state.duelSession = action.payload;
        },

        receiveDuelStateUpdate: (state, action: PayloadAction<DuelStateSnapshot>) => {
            if (state.duelSession) {
                state.duelSession.snapshot = action.payload;
            }
        },

        setDuelConnectionStatus: (state, action: PayloadAction<DuelConnectionStatus>) => {
            if (state.duelSession) {
                state.duelSession.connectionStatus = action.payload;
            }
        },

        endDuelSession: (state) => {
            state.duelSession = null;
        },

        setIncomingDuelRequest: (state, action: PayloadAction<DuelRequest | null>) => {
            state.incomingDuelRequest = action.payload;
        },
    },
});

export const {
    startGame,
    updateGameState,
    submitAnswer,
    toggleLanguage,
    endGame,
    setWager,
    clearWager,
    resetCurrentSession,
    incrementScore,
    resetStreak,
    // Duel actions
    startDuelSession,
    receiveDuelStateUpdate,
    setDuelConnectionStatus,
    endDuelSession,
    setIncomingDuelRequest,
} = playgroundSlice.actions;

// Selectors
export const selectActiveSession = (state: { playground: PlaygroundState }) => state.playground.activeSession;
export const selectIsGameOver = (state: { playground: PlaygroundState }) => state.playground.activeSession?.isGameOver;

// Duel selectors
export const selectDuelSession = (state: { playground: PlaygroundState }) => state.playground.duelSession;
export const selectIncomingDuelRequest = (state: { playground: PlaygroundState }) => state.playground.incomingDuelRequest;
export const selectIsDuelActive = (state: { playground: PlaygroundState }) => state.playground.duelSession?.snapshot.state === 'active';

export default playgroundSlice.reducer;
