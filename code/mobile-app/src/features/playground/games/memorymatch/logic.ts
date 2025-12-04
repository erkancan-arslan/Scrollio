import { GameStatus } from '../../types';
import { MemoryMatchState, Card } from './types';

const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

export const INITIAL_STATE: MemoryMatchState = {
    board: [],
    currentPlayer: 'P1',
    status: 'in_progress',
    winner: null,
    movesCount: 0,
    flippedIndices: [],
    mode: 'singleplayer',
};

export function shuffleCards(): Card[] {
    const cards: Card[] = [];
    EMOJIS.forEach((emoji, index) => {
        // Add pair
        cards.push({ id: `card-${index}-a`, value: emoji, isFlipped: false, isMatched: false });
        cards.push({ id: `card-${index}-b`, value: emoji, isFlipped: false, isMatched: false });
    });

    // Fisher-Yates shuffle
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
}

export function startNewGame(): MemoryMatchState {
    return {
        ...INITIAL_STATE,
        board: shuffleCards(),
    };
}

export function flipCard(state: MemoryMatchState, index: number): MemoryMatchState {
    if (state.status !== 'in_progress') return state;
    if (state.flippedIndices.length >= 2) return state; // Wait for reset
    if (state.board[index].isFlipped || state.board[index].isMatched) return state;

    const newBoard = [...state.board];
    newBoard[index] = { ...newBoard[index], isFlipped: true };

    const newFlippedIndices = [...state.flippedIndices, index];

    return {
        ...state,
        board: newBoard,
        flippedIndices: newFlippedIndices,
    };
}

export function checkMatch(state: MemoryMatchState): MemoryMatchState {
    if (state.flippedIndices.length !== 2) return state;

    const [idx1, idx2] = state.flippedIndices;
    const card1 = state.board[idx1];
    const card2 = state.board[idx2];

    const newBoard = [...state.board];
    let isMatch = false;

    if (card1.value === card2.value) {
        isMatch = true;
        newBoard[idx1] = { ...card1, isMatched: true };
        newBoard[idx2] = { ...card2, isMatched: true };
    } else {
        newBoard[idx1] = { ...card1, isFlipped: false };
        newBoard[idx2] = { ...card2, isFlipped: false };
    }

    // Check Win
    const allMatched = newBoard.every(card => card.isMatched);

    return {
        ...state,
        board: newBoard,
        flippedIndices: [],
        movesCount: state.movesCount + 1,
        status: allMatched ? 'win' : 'in_progress',
        winner: allMatched ? 'P1' : null,
    };
}
