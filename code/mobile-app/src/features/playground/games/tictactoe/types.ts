import { GameState, Player } from '../../types';

export type CellValue = Player | null;
export type TicTacToeBoardState = CellValue[]; // Array of 9 cells

export interface TicTacToeState extends GameState<TicTacToeBoardState> { }
