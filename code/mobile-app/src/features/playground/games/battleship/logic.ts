import { GameStatus } from '../../types';
import { BattleshipState, CellStatus, GRID_SIZE, PlayerBoardState, Ship, Orientation } from './types';

const INITIAL_SHIPS: Ship[] = [
    { id: 'carrier', name: 'Carrier', size: 4, hits: 0, placed: false },
    { id: 'battleship', name: 'Battleship', size: 3, hits: 0, placed: false },
    { id: 'cruiser', name: 'Cruiser', size: 3, hits: 0, placed: false },
    { id: 'destroyer', name: 'Destroyer', size: 2, hits: 0, placed: false },
    { id: 'submarine', name: 'Submarine', size: 2, hits: 0, placed: false },
];

const createEmptyGrid = (): CellStatus[][] =>
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill('empty'));

const createInitialPlayerState = (): PlayerBoardState => ({
    grid: createEmptyGrid(),
    ships: JSON.parse(JSON.stringify(INITIAL_SHIPS)), // Deep copy
    shots: createEmptyGrid(),
});

export const INITIAL_STATE: BattleshipState = {
    board: null,
    currentPlayer: 'P1',
    status: 'in_progress',
    winner: null,
    mode: 'multiplayer',
    phase: 'setup_p1',
    p1: createInitialPlayerState(),
    p2: createInitialPlayerState(),
    lastActionMessage: 'Player 1: Place your ships!',
    setup: {
        selectedShipId: null,
        orientation: 'horizontal',
    },
};

export function startNewGame(): BattleshipState {
    return JSON.parse(JSON.stringify(INITIAL_STATE));
}

// --- Placement Logic ---

export function canPlaceShip(
    grid: CellStatus[][],
    shipSize: number,
    row: number,
    col: number,
    orientation: Orientation
): boolean {
    if (orientation === 'horizontal') {
        if (col + shipSize > GRID_SIZE) return false;
        for (let i = 0; i < shipSize; i++) {
            if (grid[row][col + i] !== 'empty') return false;
        }
    } else {
        if (row + shipSize > GRID_SIZE) return false;
        for (let i = 0; i < shipSize; i++) {
            if (grid[row + i][col] !== 'empty') return false;
        }
    }
    return true;
}

export function placeShip(
    state: BattleshipState,
    row: number,
    col: number
): BattleshipState {
    const { phase, setup } = state;
    if (phase !== 'setup_p1' && phase !== 'setup_p2') return state;
    if (!setup.selectedShipId) return state;

    const isP1 = phase === 'setup_p1';
    const playerState = isP1 ? state.p1 : state.p2;
    const shipIndex = playerState.ships.findIndex(s => s.id === setup.selectedShipId);

    if (shipIndex === -1) return state;
    const ship = playerState.ships[shipIndex];

    // If already placed, remove it first (simple move logic)
    let newGrid = playerState.grid.map(r => [...r]);
    if (ship.placed && ship.position) {
        // Clear old position
        const { row: r, col: c, orientation: o } = ship.position;
        if (o === 'horizontal') {
            for (let i = 0; i < ship.size; i++) newGrid[r][c + i] = 'empty';
        } else {
            for (let i = 0; i < ship.size; i++) newGrid[r + i][c] = 'empty';
        }
    }

    if (!canPlaceShip(newGrid, ship.size, row, col, setup.orientation)) {
        return { ...state, lastActionMessage: 'Invalid placement!' };
    }

    // Place ship
    if (setup.orientation === 'horizontal') {
        for (let i = 0; i < ship.size; i++) newGrid[row][col + i] = 'ship';
    } else {
        for (let i = 0; i < ship.size; i++) newGrid[row + i][col] = 'ship';
    }

    const newShips = [...playerState.ships];
    newShips[shipIndex] = {
        ...ship,
        placed: true,
        position: { row, col, orientation: setup.orientation },
    };

    return {
        ...state,
        [isP1 ? 'p1' : 'p2']: {
            ...playerState,
            grid: newGrid,
            ships: newShips,
        },
        lastActionMessage: null,
    };
}

export function selectShip(state: BattleshipState, shipId: string): BattleshipState {
    return {
        ...state,
        setup: { ...state.setup, selectedShipId: shipId },
    };
}

export function toggleOrientation(state: BattleshipState): BattleshipState {
    return {
        ...state,
        setup: {
            ...state.setup,
            orientation: state.setup.orientation === 'horizontal' ? 'vertical' : 'horizontal',
        },
    };
}

export function finishSetup(state: BattleshipState): BattleshipState {
    if (state.phase === 'setup_p1') {
        // Check if all P1 ships placed
        if (state.p1.ships.some(s => !s.placed)) {
            return { ...state, lastActionMessage: 'Place all ships first!' };
        }
        return {
            ...state,
            phase: 'setup_p2',
            currentPlayer: 'P2',
            lastActionMessage: 'Player 2: Place your ships!',
            setup: { selectedShipId: null, orientation: 'horizontal' },
        };
    } else if (state.phase === 'setup_p2') {
        // Check if all P2 ships placed
        if (state.p2.ships.some(s => !s.placed)) {
            return { ...state, lastActionMessage: 'Place all ships first!' };
        }
        return {
            ...state,
            phase: 'in_progress',
            currentPlayer: 'P1',
            lastActionMessage: 'Game Started! Player 1 turn.',
        };
    }
    return state;
}

// --- Gameplay Logic ---

export function fireShot(state: BattleshipState, row: number, col: number): BattleshipState {
    if (state.phase !== 'in_progress') return state;

    const isP1 = state.currentPlayer === 'P1';
    const shooter = isP1 ? state.p1 : state.p2;
    const target = isP1 ? state.p2 : state.p1;

    if (shooter.shots[row][col] !== 'empty') {
        return { ...state, lastActionMessage: 'Already shot there!' };
    }

    const isHit = target.grid[row][col] === 'ship';
    const shotResult: CellStatus = isHit ? 'hit' : 'miss';
    const cellLabel = `${String.fromCharCode(65 + row)}${col + 1}`; // e.g., A1, B3

    // Update shooter's shots
    const newShooterShots = shooter.shots.map(r => [...r]);
    newShooterShots[row][col] = shotResult;

    // Update target's grid (damage)
    const newTargetGrid = target.grid.map(r => [...r]);
    if (isHit) {
        newTargetGrid[row][col] = 'hit';
    }

    // Update target's ships (hit count)
    let newTargetShips = [...target.ships];
    let message = `${state.currentPlayer} missed at ${cellLabel}.`;
    let sunkShipName: string | null = null;

    if (isHit) {
        message = `${state.currentPlayer} hit a ship at ${cellLabel}!`;

        // Find which ship was hit
        newTargetShips = newTargetShips.map(ship => {
            if (!ship.position) return ship;
            const { row: r, col: c, orientation: o } = ship.position;

            // Check if this coordinate belongs to this ship
            let isThisShip = false;
            if (o === 'horizontal') {
                if (row === r && col >= c && col < c + ship.size) isThisShip = true;
            } else {
                if (col === c && row >= r && row < r + ship.size) isThisShip = true;
            }

            if (isThisShip) {
                const newHits = ship.hits + 1;
                if (newHits === ship.size) {
                    sunkShipName = ship.name;
                }
                return { ...ship, hits: newHits };
            }
            return ship;
        });

        if (sunkShipName) {
            message = `${state.currentPlayer} sunk ${isP1 ? "P2" : "P1"}'s ${sunkShipName}!`;
        }
    }

    // Check Win
    const allSunk = newTargetShips.every(s => s.hits === s.size);
    let phase = state.phase;
    let winner = state.winner;

    if (allSunk) {
        phase = 'finished';
        winner = state.currentPlayer;
        message = `${state.currentPlayer} wins! All enemy ships sunk.`;
    }

    return {
        ...state,
        phase,
        winner,
        lastActionMessage: message,
        currentPlayer: isP1 ? 'P2' : 'P1', // Switch turn
        [isP1 ? 'p1' : 'p2']: { ...shooter, shots: newShooterShots },
        [isP1 ? 'p2' : 'p1']: { ...target, grid: newTargetGrid, ships: newTargetShips },
    };
}
