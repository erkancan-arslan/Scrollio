import { GameStatus } from '../../types';
import { WordGuessState } from './types';

const TURKISH_WORDS = [
    'ELMA', 'ARMUT', 'KALEM', 'KITAP', 'BILGISAYAR',
    'TELEFON', 'MASA', 'SANDALYE', 'ARABA', 'OTOBUS',
    'ISTANBUL', 'ANKARA', 'IZMIR', 'TURKIYE', 'DENIZ'
];

export const MAX_ATTEMPTS = 6;

export const INITIAL_STATE: WordGuessState = {
    board: [], // Not used for visual board state in this simple version
    currentPlayer: 'P1',
    status: 'in_progress',
    winner: null,
    targetWord: '',
    guessedLetters: [],
    remainingAttempts: MAX_ATTEMPTS,
    maxAttempts: MAX_ATTEMPTS,
    mode: 'singleplayer',
};

export function getRandomWord(): string {
    return TURKISH_WORDS[Math.floor(Math.random() * TURKISH_WORDS.length)];
}

export function startNewGame(): WordGuessState {
    return {
        ...INITIAL_STATE,
        targetWord: getRandomWord(),
    };
}

export function makeGuess(state: WordGuessState, letter: string): WordGuessState {
    if (state.status !== 'in_progress') return state;

    const upperLetter = letter.toUpperCase();
    if (state.guessedLetters.includes(upperLetter)) return state;

    const newGuessedLetters = [...state.guessedLetters, upperLetter];
    let newRemainingAttempts = state.remainingAttempts;

    if (!state.targetWord.includes(upperLetter)) {
        newRemainingAttempts--;
    }

    // Check Win/Loss
    const isWin = state.targetWord.split('').every(char => newGuessedLetters.includes(char));
    const isLoss = newRemainingAttempts <= 0;

    let status: GameStatus = 'in_progress';
    if (isWin) status = 'win';
    if (isLoss) status = 'lose';

    return {
        ...state,
        guessedLetters: newGuessedLetters,
        remainingAttempts: newRemainingAttempts,
        status,
        winner: isWin ? 'P1' : null,
    };
}
