import { GameState } from '../../types';

export type LetterFeedback = 'correct' | 'present' | 'absent' | 'empty';

export interface WordleLetter {
    char: string;
    feedback: LetterFeedback;
}

export type GuessRow = WordleLetter[];

export type TurkishWordleStatus = 'in_progress' | 'win' | 'lose';

export interface TurkishWordleState extends GameState<null> {
    targetWord: string;
    guesses: GuessRow[];
    maxAttempts: number;
    currentAttemptIndex: number;
    wordLength: number;
    status: TurkishWordleStatus;
    currentGuess: string; // To track current input before submission
    errorMessage: string | null;
}
