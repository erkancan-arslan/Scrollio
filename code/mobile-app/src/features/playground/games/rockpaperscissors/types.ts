import { GameState, Player } from '../../types';

export type RPSMove = 'rock' | 'paper' | 'scissors' | null;

export interface RockPaperScissorsState extends GameState<null> {
    player1Move: RPSMove;
    player2Move: RPSMove;
    roundWinner: Player | 'draw' | null;
}
