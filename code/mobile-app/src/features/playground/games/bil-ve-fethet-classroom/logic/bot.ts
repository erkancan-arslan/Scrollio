/**
 * Bil ve Fethet: Classroom — Bot Logic
 *
 * Medium-difficulty bot for server-side simulation.
 * - Draft: prioritize central seats maximizing adjacency options
 * - Attack: prefer targets expanding connected territory
 * - Answer: ~70-80% accuracy, 400–1200ms human-like delay
 *
 * Uses seeded RNG for reproducible behavior (debugging).
 */

import {
    ClassroomSeat,
    GRID_ROWS,
    GRID_COLS,
    TOTAL_SEATS,
} from '../types';
import {
    getNeighbors,
    getEmptySeats,
    getValidAttackTargets,
    indexToRowCol,
} from './adjacency';

// =====================================================
// Seeded RNG (mulberry32 — same as questionBank.ts)
// =====================================================

export function seededRandom(seed: number): () => number {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// =====================================================
// Draft Strategy
// =====================================================

/**
 * Bot picks a seat during draft phase.
 * Strategy: score each empty seat by centrality + adjacency potential.
 * Central seats (row 1, cols 2–5) are preferred for maximum future options.
 *
 * @param grid Current grid state
 * @param botPlayerId Bot's player ID
 * @param rng Seeded random function
 * @returns Flat index of chosen seat
 */
export function botPickDraftSeat(
    grid: ClassroomSeat[],
    botPlayerId: string,
    rng: () => number,
): number {
    const empty = getEmptySeats(grid);
    if (empty.length === 0) return -1;

    // Score each empty seat
    const scored = empty.map(index => {
        const { row, col } = indexToRowCol(index);

        // Centrality score: prefer center (row 1, col 3-4)
        const rowCenter = (GRID_ROWS - 1) / 2; // 1.0
        const colCenter = (GRID_COLS - 1) / 2;  // 3.5
        const rowDist = Math.abs(row - rowCenter);
        const colDist = Math.abs(col - colCenter);
        const centralityScore = 1 / (1 + rowDist + colDist);

        // Adjacency bonus: neighbors owned by the bot
        const neighbors = getNeighbors(index);
        const ownedNeighbors = neighbors.filter(
            n => grid[n].ownerPlayerId === botPlayerId,
        ).length;
        const adjacencyScore = ownedNeighbors * 0.3;

        // Empty neighbor bonus: more expansion options
        const emptyNeighbors = neighbors.filter(
            n => grid[n].ownerPlayerId === null,
        ).length;
        const expansionScore = emptyNeighbors * 0.1;

        // Add small random factor to avoid deterministic stalemates
        const randomFactor = rng() * 0.15;

        return {
            index,
            score: centralityScore + adjacencyScore + expansionScore + randomFactor,
        };
    });

    // Sort by score descending and pick the best
    scored.sort((a, b) => b.score - a.score);
    return scored[0].index;
}

// =====================================================
// Attack Strategy
// =====================================================

/**
 * Bot picks a target seat to attack.
 * Strategy: prefer targets that would expand connected territory
 * and avoid isolated attacks.
 *
 * @param grid Current grid state
 * @param botPlayerId Bot's player ID
 * @param rng Seeded random function
 * @returns Flat index of target seat, or null if no valid targets
 */
export function botPickAttackTarget(
    grid: ClassroomSeat[],
    botPlayerId: string,
    rng: () => number,
): number | null {
    const targets = getValidAttackTargets(grid, botPlayerId);
    if (targets.length === 0) return null;

    const scored = targets.map(index => {
        const neighbors = getNeighbors(index);

        // How many of the target's neighbors are owned by the bot?
        // More = better (we already surround it)
        const botNeighborsCount = neighbors.filter(
            n => grid[n].ownerPlayerId === botPlayerId,
        ).length;

        // How many of the target's neighbors are empty or enemy?
        // Taking this seat would give us access to more territory
        const expansionValue = neighbors.filter(
            n => grid[n].ownerPlayerId !== null && grid[n].ownerPlayerId !== botPlayerId,
        ).length;

        // Connectivity: prefer seats that connect two separate bot clusters
        const connectivityBonus = botNeighborsCount >= 2 ? 0.5 : 0;

        // Defender seat count: prefer attacking weaker players
        const seat = grid[index];
        const defenderSeatCount = grid.filter(
            s => s.ownerPlayerId === seat.ownerPlayerId,
        ).length;
        const weaknessBonus = 1 / (1 + defenderSeatCount);

        const randomFactor = rng() * 0.2;

        return {
            index,
            score: botNeighborsCount * 0.4
                + expansionValue * 0.2
                + connectivityBonus
                + weaknessBonus * 0.3
                + randomFactor,
        };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].index;
}

// =====================================================
// Answer Simulation
// =====================================================

/**
 * Bot answers a question with medium accuracy.
 *
 * @param correctAnswer The correct answer for the question
 * @param rng Seeded random function
 * @returns answer (boolean) and delayMs (400–1200ms)
 */
export function botAnswer(
    correctAnswer: boolean,
    rng: () => number,
): { answer: boolean; delayMs: number } {
    // Medium accuracy: 70–80% chance of correct answer
    const accuracy = 0.70 + rng() * 0.10; // 0.70–0.80
    const isCorrect = rng() < accuracy;
    const answer = isCorrect ? correctAnswer : !correctAnswer;

    // Human-like response delay: 400–1200ms
    const delayMs = Math.floor(400 + rng() * 800);

    return { answer, delayMs };
}
