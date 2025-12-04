import { GameState } from '../../types';

export interface Card {
    id: string;
    value: string; // Emoji or text
    isFlipped: boolean;
    isMatched: boolean;
}

export interface MemoryMatchState extends GameState<Card[]> {
    movesCount: number;
    flippedIndices: number[]; // Indices of currently flipped cards (max 2)
}
