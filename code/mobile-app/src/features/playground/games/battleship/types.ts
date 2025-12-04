import { GameState, Player } from '../../types';

export const GRID_SIZE = 6;

export type BattleshipPhase = 'setup_p1' | 'setup_p2' | 'in_progress' | 'finished';
export type Orientation = 'horizontal' | 'vertical';
export type CellStatus = 'empty' | 'ship' | 'hit' | 'miss';

export interface Ship {
    id: string;
    name: string;
    size: number;
    hits: number;
    placed: boolean;
    position?: { row: number; col: number; orientation: Orientation };
}

export interface PlayerBoardState {
    grid: CellStatus[][];
    ships: Ship[];
    shots: CellStatus[][]; // Shots fired BY this player at the opponent
}

export interface BattleshipState extends GameState<null> {
    phase: BattleshipPhase;
    p1: PlayerBoardState;
    p2: PlayerBoardState;
    lastActionMessage: string | null;
    setup: {
        selectedShipId: string | null;
        orientation: Orientation;
    };
}
