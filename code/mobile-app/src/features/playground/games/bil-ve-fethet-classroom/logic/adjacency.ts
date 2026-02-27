/**
 * Bil ve Fethet: Classroom — Grid Adjacency Logic
 *
 * 3×8 classroom seat grid with strictly 4-way orthogonal adjacency
 * (up, down, left, right). Diagonal seats are NOT connected.
 */

import { GRID_ROWS, GRID_COLS, TOTAL_SEATS, ClassroomSeat } from '../types';

// =====================================================
// Coordinate Conversions
// =====================================================

/** Convert flat index (0–23) to (row, col) */
export function indexToRowCol(index: number): { row: number; col: number } {
    return {
        row: Math.floor(index / GRID_COLS),
        col: index % GRID_COLS,
    };
}

/** Convert (row, col) to flat index (0–23) */
export function rowColToIndex(row: number, col: number): number {
    return row * GRID_COLS + col;
}

// =====================================================
// Neighbor Computation
// =====================================================

/** Orthogonal direction offsets: up, down, left, right */
const DIRECTIONS: ReadonlyArray<{ dr: number; dc: number }> = [
    { dr: -1, dc: 0 },  // up
    { dr: 1, dc: 0 },   // down
    { dr: 0, dc: -1 },  // left
    { dr: 0, dc: 1 },   // right
];

/**
 * Get the flat indices of all 4-way orthogonal neighbors of a seat.
 * Returns between 2 (corner) and 4 (center) neighbors.
 *
 * @example
 * getNeighbors(0)  // top-left corner  → [8, 1]        (down, right)
 * getNeighbors(9)  // row=1, col=1     → [1, 17, 8, 10] (up, down, left, right)
 */
export function getNeighbors(index: number): number[] {
    const { row, col } = indexToRowCol(index);
    const neighbors: number[] = [];

    for (const { dr, dc } of DIRECTIONS) {
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
            neighbors.push(rowColToIndex(nr, nc));
        }
    }

    return neighbors;
}

/**
 * Check if two seats are directly adjacent (4-way orthogonal only).
 * Diagonal is NOT adjacent.
 */
export function areAdjacent(a: number, b: number): boolean {
    const aPos = indexToRowCol(a);
    const bPos = indexToRowCol(b);
    const dr = Math.abs(aPos.row - bPos.row);
    const dc = Math.abs(aPos.col - bPos.col);
    return (dr === 1 && dc === 0) || (dr === 0 && dc === 1);
}

// =====================================================
// Attack Reachability (BFS)
// =====================================================

/**
 * Check if a player can attack a target seat.
 * The target must be:
 *   1. Not already owned by the attacker
 *   2. Owned by someone else (has an owner)
 *   3. Adjacent (4-way) to at least one seat owned by the attacker
 *
 * We use direct adjacency check (not full BFS) since the original
 * "bil ve fethet" requires the target to be directly adjacent to
 * an owned territory, not reachable via a chain.
 */
export function canAttack(
    grid: ClassroomSeat[],
    attackerPlayerId: string,
    targetSeatIndex: number,
): boolean {
    // Target must exist
    if (targetSeatIndex < 0 || targetSeatIndex >= TOTAL_SEATS) return false;

    const targetSeat = grid[targetSeatIndex];

    // Target must be owned by someone else (not null, not the attacker)
    if (!targetSeat.ownerPlayerId || targetSeat.ownerPlayerId === attackerPlayerId) {
        return false;
    }

    // Target must be adjacent to at least one seat owned by the attacker
    const neighbors = getNeighbors(targetSeatIndex);
    return neighbors.some(ni => grid[ni].ownerPlayerId === attackerPlayerId);
}

/**
 * Get all valid attack targets for a player.
 * Returns indices of enemy-owned seats adjacent to the player's territory.
 */
export function getValidAttackTargets(
    grid: ClassroomSeat[],
    attackerPlayerId: string,
): number[] {
    const targets: number[] = [];

    for (let i = 0; i < TOTAL_SEATS; i++) {
        if (canAttack(grid, attackerPlayerId, i)) {
            targets.push(i);
        }
    }

    return targets;
}

/**
 * Get all empty seats (for draft phase).
 */
export function getEmptySeats(grid: ClassroomSeat[]): number[] {
    return grid
        .filter(seat => seat.ownerPlayerId === null)
        .map(seat => seat.index);
}

/**
 * Create an initial empty 3×8 grid.
 */
export function createEmptyGrid(): ClassroomSeat[] {
    const grid: ClassroomSeat[] = [];
    for (let i = 0; i < TOTAL_SEATS; i++) {
        const { row, col } = indexToRowCol(i);
        grid.push({ index: i, row, col, ownerPlayerId: null });
    }
    return grid;
}
