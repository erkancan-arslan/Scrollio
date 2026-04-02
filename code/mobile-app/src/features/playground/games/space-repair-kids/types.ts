export type PlayerId = 'playerA' | 'playerB';

export type GamePhase = 'lobby' | 'playing' | 'won' | 'lost';

export interface RepairSlot {
    id: string;
    question: string;
    correctAnswerId: string;
    /** null = empty, PlayerId = filled by that player */
    filledByPlayerId: PlayerId | null;
}

export interface AnswerBlock {
    id: string;
    label: string;
    /** Which player holds this block in their personal inventory */
    assignedTo: PlayerId;
    /** True once the block has been successfully dropped into the correct slot */
    isUsed: boolean;
}

export interface CoopGameState {
    phase: GamePhase;
    slots: RepairSlot[];
    answers: AnswerBlock[];
    timeRemaining: number;
    roomCode: string;
    /** The local player's identity on this device */
    myPlayerId: PlayerId;
    partnerConnected: boolean;
}

/** Payload broadcast when a slot is correctly filled */
export interface SlotFilledPayload {
    slotId: string;
    answerId: string;
    playerId: PlayerId;
}

/** Payload broadcast when the host syncs the timer */
export interface TimerSyncPayload {
    timeRemaining: number;
}

/** Payload broadcast when game ends */
export interface GameOverPayload {
    outcome: 'won' | 'lost';
}

/** Payload broadcast by the host to initialise both clients identically */
export interface GameInitPayload {
    slots: RepairSlot[];
    answers: AnswerBlock[];
    timeRemaining: number;
}
