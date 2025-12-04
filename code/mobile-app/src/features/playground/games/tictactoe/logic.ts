import { Player, GameStatus } from '../../types';
import { TicTacToeState, TicTacToeBoardState, CellValue } from './types';

export const INITIAL_BOARD: TicTacToeBoardState = Array(9).fill(null);

export const INITIAL_STATE: TicTacToeState = {
    board: INITIAL_BOARD,
    currentPlayer: 'P1',
    status: 'in_progress',
    winner: null,
};

const WINNING_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

export function checkWinner(board: TicTacToeBoardState): Player | null {
    for (const combo of WINNING_COMBINATIONS) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

export function checkDraw(board: TicTacToeBoardState): boolean {
    return board.every(cell => cell !== null);
}

export function makeMove(state: TicTacToeState, index: number): TicTacToeState {
    if (state.status !== 'in_progress' || state.board[index] !== null) {
        return state;
    }

    const newBoard = [...state.board];
    newBoard[index] = state.currentPlayer;

    const winner = checkWinner(newBoard);
    let status: GameStatus = 'in_progress';
    let nextPlayer = state.currentPlayer;

    if (winner) {
        status = 'win';
    } else if (checkDraw(newBoard)) {
        status = 'draw';
    } else {
        nextPlayer = state.currentPlayer === 'P1' ? 'P2' : 'P1';
    }

    return {
        board: newBoard,
        currentPlayer: nextPlayer,
        status,
        winner,
    };
}
