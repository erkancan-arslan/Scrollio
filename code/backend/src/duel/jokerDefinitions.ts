/**
 * Joker Definitions
 * Static definitions and helpers for the duel joker mechanic.
 * All joker logic is server-authoritative.
 */

// =====================================================
// Types
// =====================================================

export type JokerId = 'SHIELD' | 'FREEZE' | 'CLEANSE';
export type JokerType = 'instant' | 'timed';

export interface JokerDefinition {
    id: JokerId;
    name: string;
    description: string;
    type: JokerType;
    durationMs: number;       // 0 for instant
    maxUsesPerMatch: number;
    /** Minimum opponent remaining ms required to use (0 = no constraint) */
    minOpponentRemainingMs: number;
}

export interface JokerActiveEffect {
    type: JokerId;
    expiresAt: number;        // Epoch ms
}

export interface JokerPlayerState {
    remainingUses: Record<JokerId, number>;
    activeEffects: JokerActiveEffect[];
    controlsLockedUntil: number | null;  // Epoch ms — set by FREEZE
    lastUsedAt: Record<string, number>;
}

// =====================================================
// Joker Registry
// =====================================================

const JOKER_DEFINITIONS: Record<JokerId, JokerDefinition> = {
    SHIELD: {
        id: 'SHIELD',
        name: 'Shield',
        description: 'Negates the next incoming time steal from opponent (lasts 10s or until triggered).',
        type: 'timed',
        durationMs: 10_000,
        maxUsesPerMatch: 1,
        minOpponentRemainingMs: 0,
    },
    FREEZE: {
        id: 'FREEZE',
        name: 'Freeze',
        description: 'Locks opponent controls for 3 seconds. Cannot be used if opponent has < 3s remaining.',
        type: 'timed',
        durationMs: 3_000,
        maxUsesPerMatch: 1,
        minOpponentRemainingMs: 3_000,
    },
    CLEANSE: {
        id: 'CLEANSE',
        name: 'Cleanse',
        description: 'Removes all debuffs (freeze, control lock) currently active on you.',
        type: 'instant',
        durationMs: 0,
        maxUsesPerMatch: 1,
        minOpponentRemainingMs: 0,
    },
};

// =====================================================
// Helpers
// =====================================================

export function getJokerDefinition(id: JokerId): JokerDefinition {
    return JOKER_DEFINITIONS[id];
}

export function getAllJokerIds(): JokerId[] {
    return Object.keys(JOKER_DEFINITIONS) as JokerId[];
}

/**
 * Create the default joker state for a new match.
 * Each player starts with max uses for every allowed joker.
 */
export function createDefaultJokerState(
    allowedJokers: JokerId[] = getAllJokerIds(),
    usesPerJoker = 1,
): JokerPlayerState {
    const remainingUses: Record<string, number> = {};
    for (const jokerId of allowedJokers) {
        const def = JOKER_DEFINITIONS[jokerId];
        remainingUses[jokerId] = usesPerJoker ?? def.maxUsesPerMatch;
    }

    return {
        remainingUses: remainingUses as Record<JokerId, number>,
        activeEffects: [],
        controlsLockedUntil: null,
        lastUsedAt: {},
    };
}

/**
 * Check if a joker can be used right now.
 * Returns null if usable, or an error message string if not.
 */
export function validateJokerUsage(
    jokerId: JokerId,
    playerState: JokerPlayerState,
    opponentRemainingMs: number,
): string | null {
    const def = JOKER_DEFINITIONS[jokerId];
    if (!def) return `Unknown joker: ${jokerId}`;

    // Check remaining uses
    const remaining = playerState.remainingUses[jokerId] ?? 0;
    if (remaining <= 0) return `${def.name} has no remaining uses`;

    // Check opponent remaining time constraint (for FREEZE)
    if (def.minOpponentRemainingMs > 0 && opponentRemainingMs < def.minOpponentRemainingMs) {
        return `Cannot use ${def.name}: opponent has less than ${def.minOpponentRemainingMs / 1000}s remaining`;
    }

    // CLEANSE: only usable if player has an active debuff
    if (jokerId === 'CLEANSE') {
        const hasDebuff =
            (playerState.controlsLockedUntil && playerState.controlsLockedUntil > Date.now()) ||
            playerState.activeEffects.some(
                (e) => e.type === 'FREEZE' && e.expiresAt > Date.now(),
            );
        if (!hasDebuff) return 'No active debuffs to cleanse';
    }

    return null; // All checks passed
}

/**
 * Remove expired effects from a player's joker state.
 * Mutates the input object in place and returns it.
 */
export function expireEffects(state: JokerPlayerState, now: number): JokerPlayerState {
    state.activeEffects = state.activeEffects.filter((e) => e.expiresAt > now);

    if (state.controlsLockedUntil && state.controlsLockedUntil <= now) {
        state.controlsLockedUntil = null;
    }

    return state;
}

/**
 * Check if a player has an active effect of a given type.
 */
export function hasActiveEffect(state: JokerPlayerState, effectType: JokerId): boolean {
    return state.activeEffects.some((e) => e.type === effectType && e.expiresAt > Date.now());
}

/**
 * Consume (remove) the first active effect of a given type.
 * Returns true if an effect was consumed, false if none found.
 */
export function consumeEffect(state: JokerPlayerState, effectType: JokerId): boolean {
    const index = state.activeEffects.findIndex(
        (e) => e.type === effectType && e.expiresAt > Date.now(),
    );
    if (index === -1) return false;
    state.activeEffects.splice(index, 1);
    return true;
}
