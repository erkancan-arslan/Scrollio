export type PlayerId = 'player' | 'bot1' | 'bot2';
export type ProvinceOwnership = Record<string, PlayerId | 'neutral'>;
export type RoundType = 'infinite_flow' | 'guessing';

export type TurnPhase =
    | 'claiming'
    | 'selecting'
    | 'battling'
    | 'defending'
    | 'result'
    | 'bot_result'
    | 'bot_turn'
    | 'guessing'
    | 'guessing_result'
    | 'game_over';

export const PLAYER_COLORS: Record<PlayerId, string> = {
    player: '#007AFF',
    bot1: '#FF3B30',
    bot2: '#34C759',
};

export const NEUTRAL_COLOR = '#3A3A3C';

export const PLAYER_LABELS: Record<PlayerId, string> = {
    player: 'Sen',
    bot1: 'Bot 1',
    bot2: 'Bot 2',
};

export interface GuessingQuestion {
    id: number;
    question: string;
    answer: number;
    unit: string;
    hint: string;
}

export interface GuessingResult {
    playerGuess: number;
    botGuess: number;
    correctAnswer: number;
    conquered: boolean;
    regionId: string;
    attackerId: PlayerId;
    defenderId: PlayerId | 'neutral';
    tie: boolean;
    playerDistance: number;
    botDistance: number;
}

export interface BattleState {
    attackerId: PlayerId;
    defenderId: PlayerId | 'neutral';
    targetRegionId: string;
    /** Attacker's live score (or pre-simulated bot score when player is defending) */
    attackerScore: number;
    /** Defender's live score — only used when player is defending (phase='defending') */
    defenderScore: number;
}

export interface TurnResult {
    conquered: boolean;
    attackerScore: number;
    defenderScore: number;
    regionId: string;
    attackerId: PlayerId;
    defenderId: PlayerId | 'neutral';
}

export interface BilVeFethetState {
    phase: TurnPhase;
    turnOrder: PlayerId[];
    currentTurnIndex: number;
    ownership: ProvinceOwnership;
    activeBattle: BattleState | null;
    lastResult: TurnResult | null;
    winner: PlayerId | null;
    /** Indices into question array, pre-shuffled for current battle */
    shuffledDeck: number[];
    /** Index into non-player bots in turnOrder during bot_turn phase */
    botTurnIndex: number;
    /** How many claiming picks have been made. Current actor = turnOrder[claimingTurnIndex % 3] */
    claimingTurnIndex: number;
    /** Active guessing question (set when phase === 'guessing') */
    guessingQuestion: GuessingQuestion | null;
    /** Bot's pre-simulated guess for the current guessing round */
    botGuess: number | null;
    /** Result of the last guessing round (set when phase === 'guessing_result') */
    lastGuessingResult: GuessingResult | null;
}
