import { GameState } from '../../types';

export interface WordGuessState extends GameState<string[]> {
    targetWord: string;
    guessedLetters: string[];
    remainingAttempts: number;
    maxAttempts: number;
}
