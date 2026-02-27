/**
 * Classroom Game Service — Frontend API + Realtime
 *
 * Handles all HTTP requests to the backend classroom endpoints
 * and Supabase Realtime subscriptions for match state updates.
 */
import { apiClient } from '../../../../../services/api/apiClient';
import { supabase } from '../../../../../services/supabase/client';
import { ClassroomMatchState, ClassroomRoom, QueueStatus } from '../types';
import { RealtimeChannel } from '@supabase/supabase-js';

class ClassroomService {
    private matchChannel: RealtimeChannel | null = null;
    private roomChannel: RealtimeChannel | null = null;
    private playerChannel: RealtimeChannel | null = null;

    // =====================================================
    // Matchmaking Queue
    // =====================================================

    async joinQueue(): Promise<{ status: string; matchId?: string }> {
        const response = await apiClient.post<{ status: string; matchId?: string }>(
            '/classroom/queue/join',
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    async leaveQueue(): Promise<{ status: string }> {
        const response = await apiClient.delete<{ status: string }>(
            '/classroom/queue/leave',
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    async quickPlay(): Promise<{ matchId: string }> {
        const response = await apiClient.post<{ matchId: string }>(
            '/classroom/quick-play',
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    // =====================================================
    // Room Management
    // =====================================================

    async createRoom(maxPlayers: number): Promise<{ roomCode: string }> {
        const response = await apiClient.post<{ roomCode: string }>(
            '/classroom/room/create',
            { maxPlayers },
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    async joinRoom(roomCode: string): Promise<{ room: ClassroomRoom }> {
        const response = await apiClient.post<{ room: ClassroomRoom }>(
            '/classroom/room/join',
            { roomCode },
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    async getRoomState(code: string): Promise<{ room: ClassroomRoom }> {
        const response = await apiClient.get<{ room: ClassroomRoom }>(
            `/classroom/room/${code}`,
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    async startRoom(roomCode: string): Promise<{ matchId: string }> {
        const response = await apiClient.post<{ matchId: string }>(
            '/classroom/room/start',
            { roomCode },
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    // =====================================================
    // Match Actions
    // =====================================================

    async getMatchState(matchId: string): Promise<ClassroomMatchState> {
        const response = await apiClient.get<ClassroomMatchState>(
            `/classroom/match/${matchId}`,
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    async submitDraftPick(matchId: string, seatIndex: number): Promise<ClassroomMatchState> {
        const response = await apiClient.post<ClassroomMatchState>(
            '/classroom/match/draft-pick',
            { matchId, seatIndex },
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    async submitAttack(matchId: string, targetSeatIndex: number): Promise<ClassroomMatchState> {
        const response = await apiClient.post<ClassroomMatchState>(
            '/classroom/match/attack',
            { matchId, targetSeatIndex },
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    async submitAnswer(matchId: string, answer: boolean): Promise<ClassroomMatchState> {
        const response = await apiClient.post<ClassroomMatchState>(
            '/classroom/match/answer',
            { matchId, answer },
        );
        if (response.error) throw new Error(response.error);
        return response.data!;
    }

    // =====================================================
    // Realtime Subscriptions
    // =====================================================

    subscribeToMatch(
        matchId: string,
        onUpdate: (state: ClassroomMatchState) => void,
        onMatchEnd?: (state: ClassroomMatchState) => void,
    ): void {
        this.unsubscribeFromMatch();

        this.matchChannel = supabase.channel(`classroom:${matchId}`);

        this.matchChannel
            .on('broadcast', { event: 'match_state' }, (payload) => {
                const state = payload.payload as ClassroomMatchState;
                onUpdate(state);
                if (state.phase === 'ended' && onMatchEnd) {
                    onMatchEnd(state);
                }
            })
            .subscribe((status) => {
                console.log(`[Classroom] Match channel status: ${status}`);
            });
    }

    async unsubscribeFromMatch(): Promise<void> {
        if (this.matchChannel) {
            await supabase.removeChannel(this.matchChannel);
            this.matchChannel = null;
        }
    }

    subscribeToRoom(
        roomCode: string,
        onUpdate: (room: ClassroomRoom) => void,
    ): void {
        this.unsubscribeFromRoom();

        this.roomChannel = supabase.channel(`classroom_room:${roomCode}`);

        this.roomChannel
            .on('broadcast', { event: 'room_state' }, (payload) => {
                onUpdate(payload.payload as ClassroomRoom);
            })
            .subscribe((status) => {
                console.log(`[Classroom] Room channel status: ${status}`);
            });
    }

    async unsubscribeFromRoom(): Promise<void> {
        if (this.roomChannel) {
            await supabase.removeChannel(this.roomChannel);
            this.roomChannel = null;
        }
    }

    subscribeToPlayerNotifications(
        userId: string,
        onMatchFound: (data: { matchId: string }) => void,
    ): void {
        this.unsubscribeFromPlayerNotifications();

        this.playerChannel = supabase.channel(`classroom_player:${userId}`);

        this.playerChannel
            .on('broadcast', { event: 'match_found' }, (payload) => {
                onMatchFound(payload.payload as { matchId: string });
            })
            .subscribe((status) => {
                console.log(`[Classroom] Player channel status: ${status}`);
            });
    }

    async unsubscribeFromPlayerNotifications(): Promise<void> {
        if (this.playerChannel) {
            await supabase.removeChannel(this.playerChannel);
            this.playerChannel = null;
        }
    }

    // =====================================================
    // Cleanup
    // =====================================================

    async cleanup(): Promise<void> {
        await this.unsubscribeFromMatch();
        await this.unsubscribeFromRoom();
        await this.unsubscribeFromPlayerNotifications();
    }
}

export const classroomService = new ClassroomService();
