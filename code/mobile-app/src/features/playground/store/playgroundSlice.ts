import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GameSession {
    gameType: string;
    score: number;
    streak: number;
    bestStreak: number;
    lives: number;
    isGameOver: boolean;
    metadata: Record<string, any>;
}

interface PlaygroundState {
    activeSession: GameSession | null;
    wager: {
        isActive: boolean;
        amount: number;
        challengeId: string | null;
    } | null;
}

const initialState: PlaygroundState = {
    activeSession: null,
    wager: null,
};

const playgroundSlice = createSlice({
    name: 'playground',
    initialState,
    reducers: {
        startGame: (state, action: PayloadAction<{ gameType: string; lives?: number }>) => {
            state.activeSession = {
                gameType: action.payload.gameType,
                score: 0,
                streak: 0,
                bestStreak: 0,
                lives: action.payload.lives ?? 1,
                isGameOver: false,
                metadata: {},
            };
        },
        endGame: (state) => {
            if (state.activeSession) {
                state.activeSession.isGameOver = true;
            }
        },
        incrementScore: (state, action: PayloadAction<number>) => {
            if (state.activeSession && !state.activeSession.isGameOver) {
                state.activeSession.score += action.payload;
                state.activeSession.streak += 1;
                if (state.activeSession.streak > state.activeSession.bestStreak) {
                    state.activeSession.bestStreak = state.activeSession.streak;
                }
            }
        },
        resetStreak: (state) => {
            if (state.activeSession && !state.activeSession.isGameOver) {
                state.activeSession.streak = 0;
                state.activeSession.lives -= 1;
                if (state.activeSession.lives <= 0) {
                    state.activeSession.isGameOver = true;
                }
            }
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
    },
});

export const { startGame, endGame, incrementScore, resetStreak, setWager, clearWager, resetCurrentSession } = playgroundSlice.actions;

export default playgroundSlice.reducer;
