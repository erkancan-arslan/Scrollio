/**
 * Duel Service
 * Handles duel request management, answer submission, and real-time match subscriptions.
 */

import { apiClient } from '../../../services/api/apiClient';
import { supabase } from '../../../services/supabase/client';
import { DuelStateSnapshot } from '../games/infinite_flow/duelTypes';
import { RealtimeChannel } from '@supabase/supabase-js';

class DuelService {
    private matchChannel: RealtimeChannel | null = null;
    private requestChannel: RealtimeChannel | null = null;

    // ===================================================
    // REST API Calls
    // ===================================================

    /**
     * Create a duel request targeting a friend.
     */
    async createDuelRequest(toUserId: string): Promise<{ requestId: string }> {
        const response = await apiClient.post<{ requestId: string }>('/duel/request', { toUserId });
        if (response.error || !response.data) {
            throw new Error(response.error || 'Failed to create duel request');
        }
        return response.data;
    }

    /**
     * Respond to a duel request (accept / reject / cancel).
     */
    async respondDuelRequest(
        requestId: string,
        action: 'accept' | 'reject' | 'cancel',
    ): Promise<{ matchId?: string }> {
        const response = await apiClient.patch<{ matchId?: string }>(`/duel/request/${requestId}`, { action });
        if (response.error || !response.data) {
            throw new Error(response.error || 'Failed to respond to duel request');
        }
        return response.data;
    }

    /**
     * Submit an answer during a duel match.
     */
    async submitDuelAnswer(
        matchId: string,
        questionIndex: number,
        answer: boolean,
    ): Promise<DuelStateSnapshot> {
        const response = await apiClient.post<DuelStateSnapshot>('/duel/answer', {
            matchId,
            questionIndex,
            answer,
            clientTimestamp: Date.now(),
        });
        if (response.error || !response.data) {
            throw new Error(response.error || 'Failed to submit duel answer');
        }
        return response.data;
    }

    /**
     * Get current match state (for reconnection).
     */
    async getDuelMatchState(matchId: string): Promise<DuelStateSnapshot> {
        const response = await apiClient.get<DuelStateSnapshot>(`/duel/match/${matchId}`);
        if (response.error || !response.data) {
            throw new Error(response.error || 'Failed to get match state');
        }
        return response.data;
    }

    /**
     * Get pending incoming duel requests.
     */
    async getPendingDuelRequests(): Promise<{ requests: any[]; total: number }> {
        const response = await apiClient.get<{ requests: any[]; total: number }>('/duel/requests/pending');
        if (response.error || !response.data) {
            throw new Error(response.error || 'Failed to get pending requests');
        }
        return response.data;
    }

    // ===================================================
    // REST API Calls (Joker)
    // ===================================================

    /**
     * Use a joker during a duel match.
     */


    // ===================================================
    // Realtime Subscriptions
    // ===================================================

    /**
     * Subscribe to match state updates via Supabase Realtime broadcast.
     */
    subscribeToMatch(
        matchId: string,
        onUpdate: (snapshot: DuelStateSnapshot) => void,
        onMatchEnd?: (snapshot: DuelStateSnapshot) => void,
    ): void {
        this.unsubscribeFromMatch();

        this.matchChannel = supabase.channel(`duel_match:${matchId}`);

        this.matchChannel
            .on('broadcast', { event: 'state_update' }, (payload) => {
                onUpdate(payload.payload as DuelStateSnapshot);
            })
            .on('broadcast', { event: 'match_started' }, (payload) => {
                onUpdate(payload.payload as DuelStateSnapshot);
            })
            .on('broadcast', { event: 'match_ended' }, (payload) => {
                const snapshot = payload.payload as DuelStateSnapshot;
                onUpdate(snapshot);
                onMatchEnd?.(snapshot);
            });

        this.matchChannel.subscribe();
    }

    /**
     * Unsubscribe from match updates.
     */
    async unsubscribeFromMatch(): Promise<void> {
        if (this.matchChannel) {
            await supabase.removeChannel(this.matchChannel);
            this.matchChannel = null;
        }
    }

    /**
     * Subscribe to duel request changes via postgres_changes (reliable).
     * Fires on INSERT (new incoming request) and UPDATE (status change).
     */
    subscribeToDuelRequestsViaDB(
        userId: string,
        onInsert: (record: any) => void,
        onUpdate: (record: any) => void,
    ): void {
        this.unsubscribeFromDuelRequests();

        this.requestChannel = supabase
            .channel(`duel_requests_db:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'duel_requests',
                    filter: `to_user_id=eq.${userId}`,
                },
                (payload) => {
                    onInsert(payload.new);
                },
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'duel_requests',
                    filter: `to_user_id=eq.${userId}`,
                },
                (payload) => {
                    onUpdate(payload.new);
                },
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'duel_requests',
                    filter: `from_user_id=eq.${userId}`,
                },
                (payload) => {
                    // Sender sees status changes (accepted/rejected/expired)
                    onUpdate(payload.new);
                },
            );

        this.requestChannel.subscribe();
    }

    /**
     * Legacy broadcast-based subscription (kept for DuelRequestModal overlay).
     */
    subscribeToDuelRequests(
        userId: string,
        onNewRequest: (data: any) => void,
        onRequestUpdate?: (data: any) => void,
    ): void {
        // This uses ephemeral broadcast — unreliable for initial notifications.
        // Use subscribeToDuelRequestsViaDB for reliable subscriptions.
        const broadcastChannel = supabase.channel(`duel_requests:${userId}`);
        broadcastChannel
            .on('broadcast', { event: 'new_request' }, (payload) => {
                onNewRequest(payload.payload);
            })
            .on('broadcast', { event: 'request_update' }, (payload) => {
                onRequestUpdate?.(payload.payload);
            });
        broadcastChannel.subscribe();
    }

    /**
     * Unsubscribe from duel request notifications.
     */
    async unsubscribeFromDuelRequests(): Promise<void> {
        if (this.requestChannel) {
            await supabase.removeChannel(this.requestChannel);
            this.requestChannel = null;
        }
    }

    /**
     * Cleanup all subscriptions.
     */
    async cleanup(): Promise<void> {
        await this.unsubscribeFromMatch();
        await this.unsubscribeFromDuelRequests();
    }

    /**
     * Join a match and signal readiness.
     */
    async joinMatch(matchId: string): Promise<DuelStateSnapshot> {
        const response = await apiClient.post<DuelStateSnapshot>('/duel/join', { matchId });
        if (response.error || !response.data) {
            throw new Error(response.error || 'Failed to join match');
        }
        return response.data;
    }

    /**
     * Use a joker during a duel match.
     */
    async useJoker(matchId: string, jokerId: string): Promise<DuelStateSnapshot> {
        const response = await apiClient.post<DuelStateSnapshot>('/duel/joker', {
            matchId,
            jokerId, // Matches UseDuelJokerDto
        });
        if (response.error || !response.data) {
            throw new Error(response.error || 'Failed to use joker');
        }
        return response.data;
    }
}

export const duelService = new DuelService();
