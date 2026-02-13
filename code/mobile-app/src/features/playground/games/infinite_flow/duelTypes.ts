/**
 * Duel Types
 * Shared types for the Infinite Flow Synchronous Duel mode.
 */

export interface DuelStateSnapshot {
    matchId: string;
    state: 'waiting' | 'active' | 'finished' | 'canceled';
    remainingMsA: number;
    remainingMsB: number;
    currentQuestionIndex: number;
    playerAAnswered: boolean;
    playerBAnswered: boolean;
    winnerId: string | null;
    finishReason: string | null;
    serverTime: number;
    startTime: number | null;
    playerAId: string;
    playerBId: string;
    readyA: boolean;
    readyB: boolean;
    seed: number;
    questionSetId: string;
    bankVersion: string;
    // Joker state
    playerAJokers: JokerPlayerState;
    playerBJokers: JokerPlayerState;
}

export interface JokerPlayerState {
    remainingUses: Record<string, number>; // Map of JokerId -> count
    activeEffects: JokerEffect[];
    controlsLockedUntil: number | null; // Timestamp
}

export interface JokerEffect {
    type: string; // 'SHIELD', 'HIDE'
    expiresAt: number | null; // Timestamp
}

export interface DuelRequest {
    id: string;
    fromUserId: string;
    toUserId: string;
    fromUserName: string;
    fromUserAvatar: string | null;
    status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'canceled';
    createdAt: string;
    expiresAt: string;
    matchId?: string;
}

export interface DuelSession {
    matchId: string;
    opponentId: string;
    opponentName: string;
    opponentAvatar: string | null;
    role: 'A' | 'B'; // Which player am I?
    seed: number;
    questionSetId: string;
    bankVersion: string;
    snapshot: DuelStateSnapshot;
    connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
}

export type DuelConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';
