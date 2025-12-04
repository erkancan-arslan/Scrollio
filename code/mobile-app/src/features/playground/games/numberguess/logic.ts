import { GameStatus, GameMode } from '../../types';
import { NumberGuessState } from './types';

export const INITIAL_STATE: NumberGuessState = {
    board: null,
    currentPlayer: 'P1',
    status: 'in_progress',
    winner: null,
    targetNumber: 0,
    minRange: 1,
    maxRange: 100,
    attempts: 0,
    lastGuess: null,
    feedback: null,
    history: [],
    mode: 'singleplayer',
};

export function startNewGame(mode: GameMode): NumberGuessState {
    return {
        ...INITIAL_STATE,
        targetNumber: Math.floor(Math.random() * 100) + 1,
        mode,
    };
}

export function makeGuess(state: NumberGuessState, guess: number): NumberGuessState {
    if (state.status !== 'in_progress') return state;

    let feedback: 'higher' | 'lower' | 'correct';
    let status: GameStatus = 'in_progress';
    let winner = null;

    if (guess === state.targetNumber) {
        feedback = 'correct';
        status = 'win';
        winner = state.currentPlayer;
    } else if (guess < state.targetNumber) {
        feedback = 'higher';
    } else {
        feedback = 'lower';
    }

    const newHistory = [
        ...state.history,
        { player: state.currentPlayer, guess, result: feedback }
    ];

    let nextPlayer = state.currentPlayer;
    if (status === 'in_progress' && state.mode === 'multiplayer') {
        nextPlayer = state.currentPlayer === 'P1' ? 'P2' : 'P1';
    }

    return {
        ...state,
        attempts: state.attempts + 1,
        lastGuess: guess,
        feedback,
        history: newHistory,
        status,
        winner,
        currentPlayer: nextPlayer,
    };
}
