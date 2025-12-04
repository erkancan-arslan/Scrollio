import { Player, GameStatus } from '../../types';
import { FourInARowState, FourInARowBoardState, CellValue } from './types';

export const ROWS = 6;
export const COLS = 7;

export const INITIAL_BOARD: FourInARowBoardState = Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

export const INITIAL_STATE: FourInARowState = {
    board: INITIAL_BOARD,
    currentPlayer: 'P1',
    status: 'in_progress',
    winner: null,
};

export function checkWinner(board: FourInARowBoardState): Player | null {
    // Check horizontal
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (board[r][c] && board[r][c] === board[r][c + 1] && board[r][c] === board[r][c + 2] && board[r][c] === board[r][c + 3]) {
                return board[r][c];
            }
        }
    }

    // Check vertical
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] && board[r][c] === board[r + 1][c] && board[r][c] === board[r + 2][c] && board[r][c] === board[r + 3][c]) {
                return board[r][c];
            }
        }
    }

    // Check diagonal (down-right)
    for (let r = 0; r < ROWS - 3; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (board[r][c] && board[r][c] === board[r + 1][c + 1] && board[r][c] === board[r + 2][c + 2] && board[r][c] === board[r + 3][c + 3]) {
                return board[r][c];
            }
        }
    }

    // Check diagonal (up-right)
    for (let r = 3; r < ROWS; r++) {
        for (let c = 0; c < COLS - 3; c++) {
            if (board[r][c] && board[r][c] === board[r - 1][c + 1] && board[r][c] === board[r - 2][c + 2] && board[r][c] === board[r - 3][c + 3]) {
                return board[r][c];
            }
        }
    }

    return null;
}

export function checkDraw(board: FourInARowBoardState): boolean {
    // If top row is full, board is full (since pieces stack)
    return board[0].every(cell => cell !== null);
}

export function makeMove(state: FourInARowState, colIndex: number): FourInARowState {
    if (state.status !== 'in_progress') {
        return state;
    }

    // Find the lowest empty row in the selected column
    let rowIndex = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (state.board[r][colIndex] === null) {
            rowIndex = r;
            break;
        }
    }

    if (rowIndex === -1) {
        // Column is full, invalid move
        return state;
    }

    // Create new board
    const newBoard = state.board.map(row => [...row]);
    newBoard[rowIndex][colIndex] = state.currentPlayer;

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
