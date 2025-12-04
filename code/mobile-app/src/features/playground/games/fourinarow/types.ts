import { GameState, Player } from '../../types';

export type CellValue = Player | null;
export type FourInARowBoardState = CellValue[][]; // 6 rows x 7 cols

export interface FourInARowState extends GameState<FourInARowBoardState> { }
