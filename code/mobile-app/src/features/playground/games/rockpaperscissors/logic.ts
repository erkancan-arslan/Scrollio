import { Player, GameStatus, GameMode } from '../../types';
import { RockPaperScissorsState, RPSMove } from './types';

export const INITIAL_STATE: RockPaperScissorsState = {
    board: null, // RPS doesn't have a board in the traditional sense
    currentPlayer: 'P1',
    status: 'in_progress',
    winner: null,
    player1Move: null,
    player2Move: null,
    roundWinner: null,
    mode: 'singleplayer', // Default, can be overridden
};

export function determineWinner(p1: RPSMove, p2: RPSMove): Player | 'draw' {
    if (p1 === p2) return 'draw';
    if (
        (p1 === 'rock' && p2 === 'scissors') ||
        (p1 === 'paper' && p2 === 'rock') ||
        (p1 === 'scissors' && p2 === 'paper')
    ) {
        return 'P1';
    }
    return 'P2';
}

export function makeMove(state: RockPaperScissorsState, move: RPSMove): RockPaperScissorsState {
    if (state.status !== 'in_progress') return state;

    let newState = { ...state };

    if (state.currentPlayer === 'P1') {
        newState.player1Move = move;

        if (state.mode === 'singleplayer') {
            // AI Move immediately
            const moves: RPSMove[] = ['rock', 'paper', 'scissors'];
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            newState.player2Move = randomMove;

            // Determine result
            const result = determineWinner(move, randomMove);
            newState.roundWinner = result;
            newState.status = result === 'draw' ? 'draw' : 'win'; // In single round RPS, a win is a game win
            newState.winner = result === 'draw' ? null : result;

        } else {
            // Multiplayer: Switch turn
            newState.currentPlayer = 'P2';
        }
    } else {
        // P2 Move (Multiplayer)
        newState.player2Move = move;

        // Determine result
        const result = determineWinner(newState.player1Move, move);
        newState.roundWinner = result;
        newState.status = result === 'draw' ? 'draw' : 'win';
        newState.winner = result === 'draw' ? null : result;
    }

    return newState;
}

export function resetGame(mode: GameMode): RockPaperScissorsState {
    return {
        ...INITIAL_STATE,
        mode,
    };
}
