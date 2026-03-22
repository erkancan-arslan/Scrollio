import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../../../../../services/supabase/client';
import { BilVeFethetState, PlayerId } from '../types';

export type PlayerMap = Record<PlayerId, { userId: string; displayName: string } | null>;

export interface LobbyPresenceData {
  userId: string;
  displayName: string;
  slot: PlayerId;
  isHost: boolean;
}

export interface PlayerActionPayload {
  fromPlayerId: PlayerId;
  type: 'SELECT_TARGET' | 'CLAIM_REGION';
  regionId: string;
}

export interface GameStatePayload {
  state: BilVeFethetState;
  playerMap: PlayerMap;
}

class BvfMultiplayerService {
  private roomChannel: RealtimeChannel | null = null;
  private gameChannel: RealtimeChannel | null = null;
  private lobbyCallbacks: ((players: LobbyPresenceData[]) => void)[] = [];
  private startGameCallbacks: (() => void)[] = [];
  private gameStateCallbacks: ((payload: GameStatePayload) => void)[] = [];
  private playerActionCallbacks: ((action: PlayerActionPayload) => void)[] = [];

  async joinLobby(
    roomCode: string,
    myData: LobbyPresenceData,
    onLobbyUpdate: (players: LobbyPresenceData[]) => void,
    onStartGame: () => void,
  ): Promise<void> {
    // Clean up existing
    if (this.roomChannel) {
      await supabase.removeChannel(this.roomChannel);
    }

    this.lobbyCallbacks = [onLobbyUpdate];
    this.startGameCallbacks = [onStartGame];

    this.roomChannel = supabase.channel(`bvf_room:${roomCode}`, {
      config: { presence: { key: myData.userId } },
    });

    this.roomChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = this.roomChannel?.presenceState() ?? {};
        const players: LobbyPresenceData[] = Object.values(presenceState)
          .flat()
          .map((p: any) => p as LobbyPresenceData);
        this.lobbyCallbacks.forEach(cb => cb(players));
      })
      .on('broadcast', { event: 'start_game' }, () => {
        this.startGameCallbacks.forEach(cb => cb());
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.roomChannel?.track(myData);
        }
      });
  }

  async broadcastStartGame(roomCode: string): Promise<void> {
    if (!this.roomChannel) return;
    await this.roomChannel.send({
      type: 'broadcast',
      event: 'start_game',
      payload: {},
    });
  }

  async joinGame(
    roomCode: string,
    onGameState: (payload: GameStatePayload) => void,
    onPlayerAction: (action: PlayerActionPayload) => void,
  ): Promise<void> {
    if (this.gameChannel) {
      await supabase.removeChannel(this.gameChannel);
    }

    this.gameStateCallbacks = [onGameState];
    this.playerActionCallbacks = [onPlayerAction];

    this.gameChannel = supabase.channel(`bvf_game:${roomCode}`);
    this.gameChannel
      .on('broadcast', { event: 'game_state' }, (payload) => {
        this.gameStateCallbacks.forEach(cb => cb(payload.payload as GameStatePayload));
      })
      .on('broadcast', { event: 'player_action' }, (payload) => {
        this.playerActionCallbacks.forEach(cb => cb(payload.payload as PlayerActionPayload));
      })
      .subscribe();
  }

  async broadcastGameState(roomCode: string, state: BilVeFethetState, playerMap: PlayerMap): Promise<void> {
    if (!this.gameChannel) return;
    await this.gameChannel.send({
      type: 'broadcast',
      event: 'game_state',
      payload: { state, playerMap } satisfies GameStatePayload,
    });
  }

  async sendPlayerAction(roomCode: string, action: PlayerActionPayload): Promise<void> {
    if (!this.gameChannel) return;
    await this.gameChannel.send({
      type: 'broadcast',
      event: 'player_action',
      payload: action,
    });
  }

  async leaveLobby(): Promise<void> {
    if (this.roomChannel) {
      await supabase.removeChannel(this.roomChannel);
      this.roomChannel = null;
    }
  }

  async cleanup(): Promise<void> {
    if (this.roomChannel) {
      await supabase.removeChannel(this.roomChannel);
      this.roomChannel = null;
    }
    if (this.gameChannel) {
      await supabase.removeChannel(this.gameChannel);
      this.gameChannel = null;
    }
    this.lobbyCallbacks = [];
    this.startGameCallbacks = [];
    this.gameStateCallbacks = [];
    this.playerActionCallbacks = [];
  }
}

export const bvfMultiplayerService = new BvfMultiplayerService();
