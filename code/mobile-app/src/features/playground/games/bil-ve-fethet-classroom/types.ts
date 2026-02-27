/**
 * Bil ve Fethet: Classroom — Shared Types
 *
 * Defines the match state, seat grid, player model, and phase enums.
 * The server is the single source of truth; client mirrors this shape.
 */

// =====================================================
// Grid Constants
// =====================================================

export const GRID_ROWS = 3;
export const GRID_COLS = 8;
export const TOTAL_SEATS = GRID_ROWS * GRID_COLS; // 24

/** Number of consecutive attack wins needed to conquer a seat */
export const CONQUEST_STREAK_REQUIRED = 2;

/** Maximum turns before failsafe ends the game */
export const MAX_TURNS = 200;

/** Question timer duration in ms */
export const QUESTION_TIMER_MS = 15000;

// =====================================================
// Player
// =====================================================

export interface ClassroomPlayer {
    id: string;
    displayName: string;
    isBot: boolean;
    color: PlayerColor;
    seatCount: number; // derived, for quick access
}

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

export const PLAYER_COLORS: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

export const PLAYER_COLOR_HEX: Record<PlayerColor, string> = {
    red: '#FF4B4B',
    blue: '#4B7BFF',
    green: '#34C759',
    yellow: '#FFD60A',
};

// =====================================================
// Seat
// =====================================================

export interface ClassroomSeat {
    index: number;    // 0–23 flat index
    row: number;      // 0–2
    col: number;      // 0–7
    ownerPlayerId: string | null;
}

// =====================================================
// Match Phases
// =====================================================

export type MatchPhase = 'waiting' | 'draft' | 'attack' | 'question' | 'ended';

// =====================================================
// Draft State
// =====================================================

export interface DraftState {
    currentPickIndex: number;       // which pick turn we're on
    startingSeatsAssigned: boolean;  // have 1-per-player starting seats been assigned?
    totalPicks: number;             // total picks needed (24)
}

// =====================================================
// Attack State
// =====================================================

export interface AttackState {
    attackerId: string | null;
    defenderId: string | null;
    targetSeatIndex: number | null;
    attackerStreakOnTarget: number;
}

// =====================================================
// Question State (active during question phase)
// =====================================================

export interface QuestionState {
    questionId: number;
    questionText: string;
    correctAnswer: boolean;
    questionIndex: number;      // index within shuffled pool
    startedAt: number;          // timestamp ms
    endsAt: number;             // timestamp ms
    answersByPlayerId: Record<string, boolean | null>;
    answeredPlayerIds: string[];
}

// =====================================================
// Question Result (feedback after resolution)
// =====================================================

export type QuestionOutcome = 'attacker_wrong' | 'both_correct' | 'streak_up' | 'conquered';

export interface QuestionResultInfo {
    attackerId: string;
    defenderId: string;
    attackerCorrect: boolean;
    defenderCorrect: boolean;
    outcome: QuestionOutcome;
    streakAfter: number;
    conqueredSeatIndex: number | null;
    targetSeatIndex: number;
    timestamp: number;
}

// =====================================================
// Result
// =====================================================

export interface MatchResult {
    winnerId: string | null;
    reason: 'all_seats' | 'max_turns' | 'disconnect';
    finalGrid: ClassroomSeat[];
    seatCounts: Record<string, number>;
}

// =====================================================
// Full Match State (Server-authoritative)
// =====================================================

export interface ClassroomMatchState {
    matchId: string;
    phase: MatchPhase;
    players: ClassroomPlayer[];
    currentTurnPlayerId: string;
    grid: ClassroomSeat[];
    draft: DraftState;
    attack: AttackState;
    question: QuestionState | null;
    lastQuestionResult: QuestionResultInfo | null;
    result: MatchResult | null;
    turnCount: number;
    maxTurns: number;
    seed: number;
    createdAt: number;
    questionPoolSize: number;
}

// =====================================================
// Client State (extends match state with local info)
// =====================================================

export interface ClassroomClientState extends ClassroomMatchState {
    myPlayerId: string;
    connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
}

// =====================================================
// Room / Matchmaking Types
// =====================================================

export interface ClassroomRoom {
    code: string;
    hostPlayerId: string;
    maxPlayers: number;
    players: ClassroomRoomPlayer[];
    status: 'waiting' | 'starting' | 'started';
    createdAt: number;
}

export interface ClassroomRoomPlayer {
    id: string;
    displayName: string;
    isReady: boolean;
}

export interface QueueStatus {
    inQueue: boolean;
    playersInQueue: number;
    estimatedWaitSec: number;
}
