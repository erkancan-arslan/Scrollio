export type Player = 'P1' | 'P2';

export type GameStatus = 'in_progress' | 'win' | 'draw' | 'lose';

export type GameMode = 'singleplayer' | 'multiplayer';

export interface GameState<BoardType> {
    board: BoardType;
    currentPlayer: Player;
    status: GameStatus;
    winner: Player | null;
    mode?: GameMode;
}
