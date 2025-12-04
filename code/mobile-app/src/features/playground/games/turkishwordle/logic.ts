import { TurkishWordleState, GuessRow, WordleLetter, LetterFeedback } from './types';
import { ALLOWED_WORDS_TR, TARGET_WORDS_TR } from './words';

const DEFAULT_WORD_LENGTH = 5;
const DEFAULT_MAX_ATTEMPTS = 6;

export function initTurkishWordleGame(config?: {
    wordLength?: number;
    maxAttempts?: number;
}): TurkishWordleState {
    const wordLength = config?.wordLength || DEFAULT_WORD_LENGTH;
    const maxAttempts = config?.maxAttempts || DEFAULT_MAX_ATTEMPTS;

    // Filter target words by length just in case
    const possibleTargets = TARGET_WORDS_TR.filter(w => w.length === wordLength);
    const targetWord = possibleTargets[Math.floor(Math.random() * possibleTargets.length)];

    return {
        board: null,
        currentPlayer: 'P1',
        mode: 'singleplayer',
        winner: null,
        targetWord,
        guesses: [],
        maxAttempts,
        currentAttemptIndex: 0,
        wordLength,
        status: 'in_progress',
        currentGuess: '',
        errorMessage: null,
    };
}

export function isValidTurkishWord(word: string, wordLength: number): boolean {
    if (word.length !== wordLength) return false;
    return ALLOWED_WORDS_TR.includes(word);
}

export function evaluateTurkishWordleGuess(targetWord: string, guess: string): GuessRow {
    const wordLength = targetWord.length;
    const targetLetters = targetWord.toLocaleUpperCase('tr-TR').split('');
    const guessLetters = guess.toLocaleUpperCase('tr-TR').split('');
    const row: GuessRow = Array(wordLength).fill(null);

    // Track available letters in target (to handle duplicates for yellow)
    const availableTargetLetters = [...targetLetters];

    // First pass: Mark CORRECT (Green)
    guessLetters.forEach((char, i) => {
        if (char === targetLetters[i]) {
            row[i] = { char, feedback: 'correct' };
            availableTargetLetters[i] = null as any; // Mark as consumed
        }
    });

    // Second pass: Mark PRESENT (Yellow) or ABSENT (Gray)
    guessLetters.forEach((char, i) => {
        if (row[i]) return; // Already marked correct

        const targetIndex = availableTargetLetters.indexOf(char);
        if (targetIndex !== -1) {
            row[i] = { char, feedback: 'present' };
            availableTargetLetters[targetIndex] = null as any; // Consume one instance
        } else {
            row[i] = { char, feedback: 'absent' };
        }
    });

    return row;
}

export function submitGuess(state: TurkishWordleState): TurkishWordleState {
    if (state.status !== 'in_progress') return state;

    const guess = state.currentGuess.toLocaleUpperCase('tr-TR');

    if (guess.length !== state.wordLength) {
        return { ...state, errorMessage: 'Kelime çok kısa' };
    }

    if (!isValidTurkishWord(guess, state.wordLength)) {
        return { ...state, errorMessage: 'Geçersiz kelime' };
    }

    const row = evaluateTurkishWordleGuess(state.targetWord, guess);

    const newGuesses = [...state.guesses, row];
    const isWin = guess === state.targetWord;
    const isLose = !isWin && newGuesses.length >= state.maxAttempts;

    return {
        ...state,
        guesses: newGuesses,
        currentAttemptIndex: state.currentAttemptIndex + 1,
        status: isWin ? 'win' : isLose ? 'lose' : 'in_progress',
        currentGuess: '', // Reset input
        errorMessage: null,
        winner: isWin ? 'P1' : null,
    };
}

export function updateCurrentGuess(state: TurkishWordleState, text: string): TurkishWordleState {
    if (state.status !== 'in_progress') return state;
    // Only allow Turkish letters
    const cleaned = text.replace(/[^A-Za-zÇçĞğIıİiÖöŞşÜü]/g, '').toLocaleUpperCase('tr-TR');
    if (cleaned.length > state.wordLength) return state;

    return {
        ...state,
        currentGuess: cleaned,
        errorMessage: null,
    };
}
