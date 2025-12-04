import { GameState } from '../../types';

export interface NumberGuessState extends GameState<null> {
    targetNumber: number;
    minRange: number;
    maxRange: number;
    attempts: number;
    lastGuess: number | null;
    feedback: 'higher' | 'lower' | 'correct' | null;
    history: { player: string; guess: number; result: string }[];
}
