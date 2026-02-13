/**
 * Snapshot of duel match state broadcast to clients.
 */

import { JokerPlayerState } from '../jokerDefinitions';

export interface DuelStateSnapshotDto {
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
    startTime: number | null; // Server timestamp of match start
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
