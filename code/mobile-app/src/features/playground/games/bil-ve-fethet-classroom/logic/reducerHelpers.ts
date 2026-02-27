/**
 * Bil ve Fethet: Classroom — Pure Reducer Helpers
 *
 * Pure functions for applying server events to match state.
 * These are used both server-side (for state transitions) and
 * client-side (for optimistic updates / state reconstruction).
 */

import {
    ClassroomMatchState,
    ClassroomSeat,
    TOTAL_SEATS,
    CONQUEST_STREAK_REQUIRED,
    MAX_TURNS,
} from '../types';

// =====================================================
// Draft Phase
// =====================================================

/**
 * Apply a draft pick: assign a seat to a player.
 * Mutates nothing — returns a new state object.
 *
 * @example
 * const next = applyDraftPick(state, 12, 'player-1');
 * // state.grid[12].ownerPlayerId === 'player-1'
 * // state.draft.currentPickIndex incremented
 */
export function applyDraftPick(
    state: ClassroomMatchState,
    seatIndex: number,
    playerId: string,
): ClassroomMatchState {
    if (seatIndex < 0 || seatIndex >= TOTAL_SEATS) return state;
    if (state.grid[seatIndex].ownerPlayerId !== null) return state;

    const newGrid = state.grid.map((seat, i) =>
        i === seatIndex
            ? { ...seat, ownerPlayerId: playerId }
            : seat,
    );

    const newPickIndex = state.draft.currentPickIndex + 1;
    const allSeatsOwned = newGrid.every(s => s.ownerPlayerId !== null);
    const nextTurnPlayerId = allSeatsOwned
        ? state.players[0].id
        : getNextDraftPlayer(state, newPickIndex);

    return {
        ...state,
        grid: newGrid,
        draft: {
            ...state.draft,
            currentPickIndex: newPickIndex,
            startingSeatsAssigned: newPickIndex >= state.players.length
                ? true
                : state.draft.startingSeatsAssigned,
        },
        currentTurnPlayerId: nextTurnPlayerId,
        phase: allSeatsOwned ? 'attack' : 'draft',
        players: updateSeatCounts(state.players, newGrid),
    };
}

/**
 * Determine the next player for draft pick (round-robin).
 */
function getNextDraftPlayer(
    state: ClassroomMatchState,
    pickIndex: number,
): string {
    const playerIndex = pickIndex % state.players.length;
    return state.players[playerIndex].id;
}

// =====================================================
// Attack Phase
// =====================================================

/**
 * Apply attack target selection. Sets up the attack state
 * and transitions to question phase.
 *
 * @example
 * const next = applyAttackSelection(state, 5, 'attacker-id', 'defender-id');
 * // next.attack.targetSeatIndex === 5
 * // next.phase === 'question' (waiting for question to be set by server)
 */
export function applyAttackSelection(
    state: ClassroomMatchState,
    targetSeatIndex: number,
    attackerId: string,
    defenderId: string,
): ClassroomMatchState {
    // If the attacker changed their target, reset streak
    const streakReset = state.attack.targetSeatIndex !== targetSeatIndex;

    return {
        ...state,
        attack: {
            attackerId,
            defenderId,
            targetSeatIndex,
            attackerStreakOnTarget: streakReset ? 0 : state.attack.attackerStreakOnTarget,
        },
    };
}

// =====================================================
// Question Resolution
// =====================================================

/**
 * Resolve a question round based on attacker and defender answers.
 *
 * Rules (from original "bil ve fethet"):
 *   - Attacker ✓ + Defender ✗ → streak++ toward conquest
 *   - Attacker ✓ + Defender ✓ → no change (round not played)
 *   - Attacker ✗ (any)        → streak reset, attack ends
 *   - Defender ✓ (any)        → streak reset, attack ends
 *
 * @example
 * // Attacker correct, defender wrong → streak goes from 0 to 1
 * const next = resolveQuestionRound(state, true, false);
 * // next.attack.attackerStreakOnTarget === 1
 *
 * // Attacker correct, defender correct → no change
 * const next2 = resolveQuestionRound(state, true, true);
 * // next2.attack.attackerStreakOnTarget unchanged
 */
export function resolveQuestionRound(
    state: ClassroomMatchState,
    attackerCorrect: boolean,
    defenderCorrect: boolean,
): ClassroomMatchState {
    const attack = { ...state.attack };

    if (!attackerCorrect) {
        // Attacker wrong → streak reset, attack ends
        attack.attackerStreakOnTarget = 0;
        return {
            ...state,
            attack,
            phase: 'attack',
            question: null,
            currentTurnPlayerId: getNextTurnPlayer(state),
            turnCount: state.turnCount + 1,
        };
    }

    if (defenderCorrect) {
        // Defender correct → streak reset, attack ends
        attack.attackerStreakOnTarget = 0;
        return {
            ...state,
            attack,
            phase: 'attack',
            question: null,
            currentTurnPlayerId: getNextTurnPlayer(state),
            turnCount: state.turnCount + 1,
        };
    }

    // Attacker correct + Defender wrong → streak++
    attack.attackerStreakOnTarget += 1;

    // Check if conquest threshold reached
    if (attack.attackerStreakOnTarget >= CONQUEST_STREAK_REQUIRED) {
        return applyConquer(
            {
                ...state,
                attack,
                question: null,
            },
            attack.targetSeatIndex!,
            attack.attackerId!,
        );
    }

    // Continue attack (same attacker stays on same target)
    return {
        ...state,
        attack,
        phase: 'attack',
        question: null,
    };
}

// =====================================================
// Conquest
// =====================================================

/**
 * Apply conquest: flip seat ownership from defender to attacker.
 * Then check win condition.
 *
 * @example
 * const next = applyConquer(state, 5, 'attacker-id');
 * // next.grid[5].ownerPlayerId === 'attacker-id'
 */
export function applyConquer(
    state: ClassroomMatchState,
    targetSeatIndex: number,
    newOwnerId: string,
): ClassroomMatchState {
    const newGrid = state.grid.map((seat, i) =>
        i === targetSeatIndex
            ? { ...seat, ownerPlayerId: newOwnerId }
            : seat,
    );

    const newPlayers = updateSeatCounts(state.players, newGrid);

    // Check for elimination: remove players with 0 seats
    const activePlayers = newPlayers.filter(p => p.seatCount > 0);

    const winner = checkWinCondition(newGrid);

    // Check failsafe max turns
    const isMaxTurns = state.turnCount >= state.maxTurns;

    if (winner || activePlayers.length <= 1 || isMaxTurns) {
        const winnerId = winner
            || (activePlayers.length === 1 ? activePlayers[0].id : null)
            || getMostSeatsPlayer(newPlayers);

        return {
            ...state,
            grid: newGrid,
            players: newPlayers,
            phase: 'ended',
            attack: {
                attackerId: null,
                defenderId: null,
                targetSeatIndex: null,
                attackerStreakOnTarget: 0,
            },
            question: null,
            result: {
                winnerId,
                reason: winner ? 'all_seats' : (isMaxTurns ? 'max_turns' : 'all_seats'),
                finalGrid: newGrid,
                seatCounts: Object.fromEntries(
                    newPlayers.map(p => [p.id, p.seatCount]),
                ),
            },
            currentTurnPlayerId: getNextTurnPlayer(state),
            turnCount: state.turnCount + 1,
        };
    }

    // Continue: advance turn to next player
    return {
        ...state,
        grid: newGrid,
        players: newPlayers,
        attack: {
            attackerId: null,
            defenderId: null,
            targetSeatIndex: null,
            attackerStreakOnTarget: 0,
        },
        question: null,
        phase: 'attack',
        currentTurnPlayerId: getNextTurnPlayer(state),
        turnCount: state.turnCount + 1,
    };
}

// =====================================================
// Win Condition
// =====================================================

/**
 * Check if a single player owns all 24 seats.
 * Returns the winnerId or null.
 */
export function checkWinCondition(grid: ClassroomSeat[]): string | null {
    const owners = new Set(grid.map(s => s.ownerPlayerId).filter(Boolean));
    if (owners.size === 1) {
        return grid[0].ownerPlayerId;
    }
    return null;
}

// =====================================================
// Helpers
// =====================================================

/**
 * Get the next player in turn order, skipping eliminated players.
 */
function getNextTurnPlayer(state: ClassroomMatchState): string {
    const currentIndex = state.players.findIndex(
        p => p.id === state.currentTurnPlayerId,
    );

    // Find next player who still has seats
    for (let offset = 1; offset <= state.players.length; offset++) {
        const nextIndex = (currentIndex + offset) % state.players.length;
        const nextPlayer = state.players[nextIndex];
        const seatCount = state.grid.filter(
            s => s.ownerPlayerId === nextPlayer.id,
        ).length;
        if (seatCount > 0) {
            return nextPlayer.id;
        }
    }

    // Fallback (should not happen)
    return state.currentTurnPlayerId;
}

/**
 * Update seatCount on each player based on current grid.
 */
function updateSeatCounts(
    players: ClassroomMatchState['players'],
    grid: ClassroomSeat[],
): ClassroomMatchState['players'] {
    return players.map(p => ({
        ...p,
        seatCount: grid.filter(s => s.ownerPlayerId === p.id).length,
    }));
}

/**
 * Get the player with the most seats (for failsafe tiebreak).
 */
function getMostSeatsPlayer(
    players: ClassroomMatchState['players'],
): string | null {
    if (players.length === 0) return null;
    return players.reduce((best, p) =>
        p.seatCount > best.seatCount ? p : best,
    ).id;
}
