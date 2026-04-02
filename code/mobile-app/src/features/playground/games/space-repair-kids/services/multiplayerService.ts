import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../../../../services/supabase/client';
import {
    GameInitPayload,
    GameOverPayload,
    PlayerId,
    SlotFilledPayload,
    TimerSyncPayload,
} from '../types';

export interface LobbyPresenceData {
    userId: string;
    displayName: string;
    slot: PlayerId;
    isHost: boolean;
}

class SpaceRepairMultiplayerService {
    private lobbyChannel: RealtimeChannel | null = null;
    private gameChannel: RealtimeChannel | null = null;

    private lobbyCallbacks: ((players: LobbyPresenceData[]) => void)[] = [];
    private startGameCallbacks: (() => void)[] = [];
    private gameInitCallbacks: ((payload: GameInitPayload) => void)[] = [];
    private slotFilledCallbacks: ((payload: SlotFilledPayload) => void)[] = [];
    private timerSyncCallbacks: ((payload: TimerSyncPayload) => void)[] = [];
    private gameOverCallbacks: ((payload: GameOverPayload) => void)[] = [];

    // ──────────────────────────────────────────────
    // Lobby
    // ──────────────────────────────────────────────

    async joinLobby(
        roomCode: string,
        myData: LobbyPresenceData,
        onLobbyUpdate: (players: LobbyPresenceData[]) => void,
        onStartGame: () => void,
    ): Promise<void> {
        if (this.lobbyChannel) {
            await supabase.removeChannel(this.lobbyChannel);
        }

        this.lobbyCallbacks = [onLobbyUpdate];
        this.startGameCallbacks = [onStartGame];

        this.lobbyChannel = supabase.channel(`space_repair_lobby:${roomCode}`, {
            config: { presence: { key: myData.userId } },
        });

        this.lobbyChannel
            .on('presence', { event: 'sync' }, () => {
                const state = this.lobbyChannel?.presenceState() ?? {};
                const players: LobbyPresenceData[] = Object.values(state)
                    .flat()
                    .map((p: any) => p as LobbyPresenceData);
                this.lobbyCallbacks.forEach(cb => cb(players));
            })
            .on('broadcast', { event: 'start_game' }, () => {
                this.startGameCallbacks.forEach(cb => cb());
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await this.lobbyChannel?.track(myData);
                }
            });
    }

    async broadcastStartGame(roomCode: string): Promise<void> {
        if (!this.lobbyChannel) return;
        await this.lobbyChannel.send({
            type: 'broadcast',
            event: 'start_game',
            payload: {},
        });
    }

    // ──────────────────────────────────────────────
    // Game
    // ──────────────────────────────────────────────

    async joinGame(
        roomCode: string,
        onGameInit: (payload: GameInitPayload) => void,
        onSlotFilled: (payload: SlotFilledPayload) => void,
        onTimerSync: (payload: TimerSyncPayload) => void,
        onGameOver: (payload: GameOverPayload) => void,
    ): Promise<void> {
        if (this.gameChannel) {
            await supabase.removeChannel(this.gameChannel);
        }

        this.gameInitCallbacks = [onGameInit];
        this.slotFilledCallbacks = [onSlotFilled];
        this.timerSyncCallbacks = [onTimerSync];
        this.gameOverCallbacks = [onGameOver];

        this.gameChannel = supabase.channel(`space_repair_game:${roomCode}`);
        this.gameChannel
            .on('broadcast', { event: 'game_init' }, ({ payload }) => {
                this.gameInitCallbacks.forEach(cb => cb(payload as GameInitPayload));
            })
            .on('broadcast', { event: 'slot_filled' }, ({ payload }) => {
                this.slotFilledCallbacks.forEach(cb => cb(payload as SlotFilledPayload));
            })
            .on('broadcast', { event: 'timer_sync' }, ({ payload }) => {
                this.timerSyncCallbacks.forEach(cb => cb(payload as TimerSyncPayload));
            })
            .on('broadcast', { event: 'game_over' }, ({ payload }) => {
                this.gameOverCallbacks.forEach(cb => cb(payload as GameOverPayload));
            })
            .subscribe();
    }

    async broadcastGameInit(roomCode: string, payload: GameInitPayload): Promise<void> {
        if (!this.gameChannel) return;
        await this.gameChannel.send({ type: 'broadcast', event: 'game_init', payload });
    }

    async broadcastSlotFilled(roomCode: string, payload: SlotFilledPayload): Promise<void> {
        if (!this.gameChannel) return;
        await this.gameChannel.send({ type: 'broadcast', event: 'slot_filled', payload });
    }

    async broadcastTimerSync(roomCode: string, payload: TimerSyncPayload): Promise<void> {
        if (!this.gameChannel) return;
        await this.gameChannel.send({ type: 'broadcast', event: 'timer_sync', payload });
    }

    async broadcastGameOver(roomCode: string, payload: GameOverPayload): Promise<void> {
        if (!this.gameChannel) return;
        await this.gameChannel.send({ type: 'broadcast', event: 'game_over', payload });
    }

    // ──────────────────────────────────────────────
    // Cleanup
    // ──────────────────────────────────────────────

    async cleanup(): Promise<void> {
        if (this.lobbyChannel) {
            await supabase.removeChannel(this.lobbyChannel);
            this.lobbyChannel = null;
        }
        if (this.gameChannel) {
            await supabase.removeChannel(this.gameChannel);
            this.gameChannel = null;
        }
        this.lobbyCallbacks = [];
        this.startGameCallbacks = [];
        this.gameInitCallbacks = [];
        this.slotFilledCallbacks = [];
        this.timerSyncCallbacks = [];
        this.gameOverCallbacks = [];
    }
}

export const spaceRepairService = new SpaceRepairMultiplayerService();
