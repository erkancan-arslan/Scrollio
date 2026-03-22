/**
 * Classroom Game Service — Server-Authoritative Game Logic
 *
 * Manages the complete lifecycle of "Bil ve Fethet: Classroom" matches:
 * - Matchmaking queue (with bot backfill)
 * - Room creation/join/start
 * - Draft phase (seat selection)
 * - Attack phase (adjacency-validated target selection)
 * - Question phase (synchronous answer collection)
 * - Conquest (2-consecutive-wins rule)
 * - Win detection
 * - Realtime state broadcast via Supabase
 *
 * All game state is kept in-memory (same pattern as DuelService).
 */
import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
    getShuffledQuestions,
    getCorrectAnswer,
    getTotalQuestions,
} from '../duel/questionBank';
import * as crypto from 'crypto';

// =====================================================
// Constants
// =====================================================

const GRID_ROWS = 3;
const GRID_COLS = 8;
const TOTAL_SEATS = GRID_ROWS * GRID_COLS;
const CONQUEST_STREAK_REQUIRED = 2;
const MAX_TURNS = 200;
const QUESTION_TIMER_MS = 20000;
const QUEUE_BOT_FILL_DELAY_MS = 10000;
const ROOM_CODE_LENGTH = 6;

const PLAYER_COLORS = ['red', 'blue', 'green', 'yellow'] as const;

// Bot names
const BOT_NAMES = ['Ayşe Bot', 'Mehmet Bot', 'Zeynep Bot', 'Can Bot', 'Elif Bot', 'Emre Bot'];

// =====================================================
// Types (server-side only)
// =====================================================

interface ClassroomPlayer {
    id: string;
    displayName: string;
    isBot: boolean;
    color: string;
    seatCount: number;
}

interface ClassroomSeat {
    index: number;
    row: number;
    col: number;
    ownerPlayerId: string | null;
}

export interface ClassroomMatchState {
    matchId: string;
    phase: 'waiting' | 'draft' | 'attack' | 'question' | 'ended';
    players: ClassroomPlayer[];
    currentTurnPlayerId: string;
    grid: ClassroomSeat[];
    draft: {
        currentPickIndex: number;
        startingSeatsAssigned: boolean;
        totalPicks: number;
    };
    attack: {
        attackerId: string | null;
        defenderId: string | null;
        targetSeatIndex: number | null;
        attackerStreakOnTarget: number;
    };
    question: {
        startedAt: number;
        endsAt: number;
        scoresByPlayerId: Record<string, number | null>;
        answeredPlayerIds: string[];
    } | null;
    lastQuestionResult: {
        attackerId: string;
        defenderId: string;
        attackerCorrect: boolean;
        defenderCorrect: boolean;
        attackerRoundScore: number;
        defenderRoundScore: number;
        outcome: 'attacker_wrong' | 'both_correct' | 'streak_up' | 'conquered' | 'defender_wins';
        streakAfter: number;
        conqueredSeatIndex: number | null;
        targetSeatIndex: number;
        timestamp: number;
    } | null;
    result: {
        winnerId: string | null;
        reason: string;
        finalGrid: ClassroomSeat[];
        seatCounts: Record<string, number>;
    } | null;
    turnCount: number;
    maxTurns: number;
    seed: number;
    createdAt: number;
    questionPoolSize: number;
    currentQuestionPoolIndex: number;
}

export interface ClassroomRoom {
    code: string;
    hostPlayerId: string;
    maxPlayers: number;
    players: { id: string; displayName: string; isReady: boolean }[];
    status: 'waiting' | 'starting' | 'started';
    createdAt: number;
}

interface QueueEntry {
    userId: string;
    displayName: string;
    joinedAt: number;
}

// =====================================================
// Seeded RNG (mulberry32)
// =====================================================

function seededRandom(seed: number): () => number {
    let s = seed | 0;
    return () => {
        s = (s + 0x6d2b79f5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// =====================================================
// Service
// =====================================================

@Injectable()
export class ClassroomService {
    private readonly logger = new Logger(ClassroomService.name);

    // In-memory stores
    private matches = new Map<string, ClassroomMatchState>();
    private rooms = new Map<string, ClassroomRoom>();
    private queue: QueueEntry[] = [];
    private queueTimer: NodeJS.Timeout | null = null;
    private locks = new Map<string, Promise<void>>();
    // Per-match bot RNG
    private botRngs = new Map<string, () => number>();

    constructor(private readonly supabaseService: SupabaseService) { }

    // =====================================================
    // Lock Helper (prevents race conditions per match)
    // =====================================================

    private async runWithLock<T>(matchId: string, task: () => Promise<T>): Promise<T> {
        while (this.locks.has(matchId)) {
            await this.locks.get(matchId);
        }
        let resolve: () => void;
        const lockPromise = new Promise<void>(r => { resolve = r; });
        this.locks.set(matchId, lockPromise);
        try {
            return await task();
        } finally {
            this.locks.delete(matchId);
            resolve!();
        }
    }

    // =====================================================
    // Grid Helpers
    // =====================================================

    private createEmptyGrid(): ClassroomSeat[] {
        const grid: ClassroomSeat[] = [];
        for (let i = 0; i < TOTAL_SEATS; i++) {
            grid.push({
                index: i,
                row: Math.floor(i / GRID_COLS),
                col: i % GRID_COLS,
                ownerPlayerId: null,
            });
        }
        return grid;
    }

    private getNeighbors(index: number): number[] {
        const row = Math.floor(index / GRID_COLS);
        const col = index % GRID_COLS;
        const neighbors: number[] = [];
        if (row > 0) neighbors.push((row - 1) * GRID_COLS + col);
        if (row < GRID_ROWS - 1) neighbors.push((row + 1) * GRID_COLS + col);
        if (col > 0) neighbors.push(row * GRID_COLS + (col - 1));
        if (col < GRID_COLS - 1) neighbors.push(row * GRID_COLS + (col + 1));
        return neighbors;
    }

    private canAttack(grid: ClassroomSeat[], attackerId: string, targetIndex: number): boolean {
        if (targetIndex < 0 || targetIndex >= TOTAL_SEATS) return false;
        const target = grid[targetIndex];
        if (!target.ownerPlayerId || target.ownerPlayerId === attackerId) return false;
        return this.getNeighbors(targetIndex).some(ni => grid[ni].ownerPlayerId === attackerId);
    }

    private getValidAttackTargets(grid: ClassroomSeat[], attackerId: string): number[] {
        const targets: number[] = [];
        for (let i = 0; i < TOTAL_SEATS; i++) {
            if (this.canAttack(grid, attackerId, i)) targets.push(i);
        }
        return targets;
    }

    private updateSeatCounts(players: ClassroomPlayer[], grid: ClassroomSeat[]): ClassroomPlayer[] {
        return players.map(p => ({
            ...p,
            seatCount: grid.filter(s => s.ownerPlayerId === p.id).length,
        }));
    }

    private getNextTurnPlayer(match: ClassroomMatchState): string {
        const idx = match.players.findIndex(p => p.id === match.currentTurnPlayerId);
        for (let offset = 1; offset <= match.players.length; offset++) {
            const nextIdx = (idx + offset) % match.players.length;
            const p = match.players[nextIdx];
            if (match.grid.some(s => s.ownerPlayerId === p.id)) return p.id;
        }
        return match.currentTurnPlayerId;
    }

    // =====================================================
    // Match Creation
    // =====================================================

    private createMatch(players: { id: string; displayName: string; isBot: boolean }[]): ClassroomMatchState {
        const matchId = crypto.randomUUID();
        const seed = Date.now();
        const rng = seededRandom(seed);
        this.botRngs.set(matchId, seededRandom(seed + 1)); // separate RNG for bots

        const matchPlayers: ClassroomPlayer[] = players.map((p, i) => ({
            ...p,
            color: PLAYER_COLORS[i % PLAYER_COLORS.length],
            seatCount: 0,
        }));

        const match: ClassroomMatchState = {
            matchId,
            phase: 'draft',
            players: matchPlayers,
            currentTurnPlayerId: matchPlayers[0].id,
            grid: this.createEmptyGrid(),
            draft: {
                currentPickIndex: 0,
                startingSeatsAssigned: false,
                totalPicks: TOTAL_SEATS,
            },
            attack: {
                attackerId: null,
                defenderId: null,
                targetSeatIndex: null,
                attackerStreakOnTarget: 0,
            },
            question: null,
            lastQuestionResult: null,
            result: null,
            turnCount: 0,
            maxTurns: MAX_TURNS,
            seed,
            createdAt: Date.now(),
            questionPoolSize: getTotalQuestions(),
            currentQuestionPoolIndex: 0,
        };

        this.matches.set(matchId, match);
        this.logger.log(`Match created: ${matchId} with ${players.length} players`);

        // Broadcast initial state
        this.broadcastMatchState(match);

        // If the first player is a bot, auto-pick after a delay
        this.scheduleBotTurnIfNeeded(match);

        return match;
    }

    // =====================================================
    // Queue (Random 4-player)
    // =====================================================

    async joinQueue(userId: string, displayName: string): Promise<{ status: string; matchId?: string }> {
        // Already in queue?
        if (this.queue.some(e => e.userId === userId)) {
            return { status: 'already_in_queue' };
        }

        this.queue.push({ userId, displayName, joinedAt: Date.now() });
        this.logger.log(`Player ${userId} joined queue. Queue size: ${this.queue.length}`);

        // If we have 4 players, start immediately
        if (this.queue.length >= 4) {
            return this.startMatchFromQueue();
        }

        // Start bot fill timer if not already running
        if (!this.queueTimer) {
            this.queueTimer = setTimeout(() => {
                this.fillQueueWithBots();
            }, QUEUE_BOT_FILL_DELAY_MS);
        }

        return { status: 'queued' };
    }

    /**
     * Instantly create a match with 1 human + 3 medium bots.
     * Used for "Rastgele Oyna" — no queue waiting.
     */
    async quickPlay(userId: string, displayName: string): Promise<{ matchId: string }> {
        const humanPlayer = { id: userId, displayName, isBot: false };

        // Create 3 bots
        const botPlayers = Array.from({ length: 3 }, (_, i) => ({
            id: `bot-${crypto.randomUUID().substring(0, 8)}`,
            displayName: BOT_NAMES[i % BOT_NAMES.length],
            isBot: true,
        }));

        const allPlayers = [humanPlayer, ...botPlayers];
        const match = this.createMatch(allPlayers);

        this.logger.log(`Quick play match created: ${match.matchId} for ${userId}`);
        return { matchId: match.matchId };
    }

    async leaveQueue(userId: string): Promise<{ status: string }> {
        this.queue = this.queue.filter(e => e.userId !== userId);
        if (this.queue.length === 0 && this.queueTimer) {
            clearTimeout(this.queueTimer);
            this.queueTimer = null;
        }
        return { status: 'left_queue' };
    }

    private async startMatchFromQueue(): Promise<{ status: string; matchId: string }> {
        const players = this.queue.splice(0, 4).map(e => ({
            id: e.userId,
            displayName: e.displayName,
            isBot: false,
        }));

        if (this.queueTimer) {
            clearTimeout(this.queueTimer);
            this.queueTimer = null;
        }

        const match = this.createMatch(players);
        return { status: 'match_started', matchId: match.matchId };
    }

    private async fillQueueWithBots(): Promise<void> {
        this.queueTimer = null;
        if (this.queue.length === 0) return;

        const humanPlayers = this.queue.splice(0, 4).map(e => ({
            id: e.userId,
            displayName: e.displayName,
            isBot: false,
        }));

        const botsNeeded = 4 - humanPlayers.length;
        const botPlayers = Array.from({ length: botsNeeded }, (_, i) => ({
            id: `bot-${crypto.randomUUID().substring(0, 8)}`,
            displayName: BOT_NAMES[i % BOT_NAMES.length],
            isBot: true,
        }));

        const allPlayers = [...humanPlayers, ...botPlayers];
        const match = this.createMatch(allPlayers);

        // Notify human players about the match
        for (const player of humanPlayers) {
            this.broadcastToPlayer(player.id, 'match_found', { matchId: match.matchId });
        }
    }

    // =====================================================
    // Room Management
    // =====================================================

    async createRoom(
        userId: string,
        displayName: string,
        maxPlayers: number,
    ): Promise<{ roomCode: string }> {
        const code = this.generateRoomCode();
        const room: ClassroomRoom = {
            code,
            hostPlayerId: userId,
            maxPlayers,
            players: [{ id: userId, displayName, isReady: true }],
            status: 'waiting',
            createdAt: Date.now(),
        };
        this.rooms.set(code, room);
        this.logger.log(`Room created: ${code} by ${userId} (max ${maxPlayers})`);
        return { roomCode: code };
    }

    async joinRoom(
        userId: string,
        displayName: string,
        roomCode: string,
    ): Promise<{ room: ClassroomRoom }> {
        const room = this.rooms.get(roomCode);
        if (!room) throw new NotFoundException('Room not found or expired');
        if (room.status !== 'waiting') throw new BadRequestException('Room is no longer accepting players');
        if (room.players.length >= room.maxPlayers) throw new BadRequestException('Room is full');
        if (room.players.some(p => p.id === userId)) throw new BadRequestException('Already in this room');

        room.players.push({ id: userId, displayName, isReady: true });
        this.logger.log(`Player ${userId} joined room ${roomCode}. Players: ${room.players.length}/${room.maxPlayers}`);

        // Broadcast updated room state
        this.broadcastRoomState(room);

        return { room };
    }

    async getRoomState(code: string): Promise<{ room: ClassroomRoom }> {
        const room = this.rooms.get(code);
        if (!room) throw new NotFoundException('Room not found');
        return { room };
    }

    async startRoom(userId: string, roomCode: string): Promise<{ matchId: string }> {
        const room = this.rooms.get(roomCode);
        if (!room) throw new NotFoundException('Room not found');
        if (room.hostPlayerId !== userId) throw new ForbiddenException('Only the host can start the game');
        if (room.players.length < 2) throw new BadRequestException('Need at least 2 players');

        room.status = 'starting';

        // Fill with bots if room isn't full
        const humanPlayers = room.players.map(p => ({
            id: p.id,
            displayName: p.displayName,
            isBot: false,
        }));

        const botsNeeded = room.maxPlayers - humanPlayers.length;
        const botPlayers = Array.from({ length: botsNeeded }, (_, i) => ({
            id: `bot-${crypto.randomUUID().substring(0, 8)}`,
            displayName: BOT_NAMES[i % BOT_NAMES.length],
            isBot: true,
        }));

        const allPlayers = [...humanPlayers, ...botPlayers];
        const match = this.createMatch(allPlayers);

        room.status = 'started';

        // Broadcast match started
        this.broadcastRoomState(room);
        for (const p of humanPlayers) {
            this.broadcastToPlayer(p.id, 'match_found', { matchId: match.matchId });
        }

        return { matchId: match.matchId };
    }

    private generateRoomCode(): string {
        return crypto.randomBytes(3).toString('hex').toUpperCase().substring(0, ROOM_CODE_LENGTH);
    }

    // =====================================================
    // Match State Retrieval
    // =====================================================

    async getMatchState(userId: string, matchId: string): Promise<ClassroomMatchState> {
        const match = this.matches.get(matchId);
        if (!match) throw new NotFoundException('Match not found');

        // Verify player is a participant
        const isParticipant = match.players.some(p => p.id === userId);
        if (!isParticipant) throw new ForbiddenException('Not a participant in this match');

        return this.sanitizeMatchState(match);
    }

    // =====================================================
    // Draft Phase
    // =====================================================

    async draftPick(userId: string, matchId: string, seatIndex: number): Promise<ClassroomMatchState> {
        return this.runWithLock(matchId, async () => {
            const match = this.matches.get(matchId);
            if (!match) throw new NotFoundException('Match not found');
            if (match.phase !== 'draft') throw new BadRequestException('Not in draft phase');
            if (match.currentTurnPlayerId !== userId) throw new ForbiddenException('Not your turn');
            if (seatIndex < 0 || seatIndex >= TOTAL_SEATS) throw new BadRequestException('Invalid seat index');
            if (match.grid[seatIndex].ownerPlayerId !== null) throw new BadRequestException('Seat already taken');

            // Apply pick
            match.grid[seatIndex].ownerPlayerId = userId;
            match.draft.currentPickIndex++;

            if (match.draft.currentPickIndex >= match.players.length) {
                match.draft.startingSeatsAssigned = true;
            }

            // Update seat counts
            match.players = this.updateSeatCounts(match.players, match.grid);

            // Check if all seats are assigned
            const allOwned = match.grid.every(s => s.ownerPlayerId !== null);
            if (allOwned) {
                match.phase = 'attack';
                match.currentTurnPlayerId = match.players[0].id;
                this.logger.log(`Match ${matchId}: Draft complete, entering attack phase`);
            } else {
                // Next player's turn (round-robin)
                const nextIdx = match.draft.currentPickIndex % match.players.length;
                match.currentTurnPlayerId = match.players[nextIdx].id;
            }

            this.broadcastMatchState(match);
            this.scheduleBotTurnIfNeeded(match);

            return this.sanitizeMatchState(match);
        });
    }

    // =====================================================
    // Attack Phase
    // =====================================================

    async attack(userId: string, matchId: string, targetSeatIndex: number): Promise<ClassroomMatchState> {
        return this.runWithLock(matchId, async () => {
            const match = this.matches.get(matchId);
            if (!match) throw new NotFoundException('Match not found');
            if (match.phase !== 'attack') throw new BadRequestException('Not in attack phase');
            if (match.currentTurnPlayerId !== userId) throw new ForbiddenException('Not your turn');

            // Validate adjacency
            if (!this.canAttack(match.grid, userId, targetSeatIndex)) {
                throw new BadRequestException('Invalid attack target: not adjacent or not enemy-owned');
            }

            const targetSeat = match.grid[targetSeatIndex];
            const defenderId = targetSeat.ownerPlayerId!;

            // If target changed, reset streak
            if (match.attack.targetSeatIndex !== targetSeatIndex) {
                match.attack.attackerStreakOnTarget = 0;
            }

            match.attack.attackerId = userId;
            match.attack.defenderId = defenderId;
            match.attack.targetSeatIndex = targetSeatIndex;

            match.question = {
                startedAt: Date.now(),
                endsAt: Date.now() + QUESTION_TIMER_MS,
                scoresByPlayerId: {},
                answeredPlayerIds: [],
            };

            // Initialize scores for attacker and defender
            for (const p of match.players) {
                match.question.scoresByPlayerId[p.id] = null;
            }

            match.phase = 'question';

            this.broadcastMatchState(match);

            // Schedule question timer expiry
            this.scheduleQuestionTimeout(match);

            // Schedule bot answers
            this.scheduleBotAnswers(match);

            return this.sanitizeMatchState(match);
        });
    }

    // =====================================================
    // Question Phase — Answer Submission
    // =====================================================

    async submitAnswer(userId: string, matchId: string, score: number): Promise<ClassroomMatchState> {
        return this.runWithLock(matchId, async () => {
            const match = this.matches.get(matchId);
            if (!match) throw new NotFoundException('Match not found');
            if (match.phase !== 'question') throw new BadRequestException('Not in question phase');
            if (!match.question) throw new BadRequestException('No active question');

            // Check if already answered
            if (match.question.answeredPlayerIds.includes(userId)) {
                throw new BadRequestException('Already answered');
            }

            // Verify user is a participant
            const isParticipant = match.players.some(p => p.id === userId);
            if (!isParticipant) throw new ForbiddenException('Not a participant');

            // Record score
            match.question.scoresByPlayerId[userId] = score;
            match.question.answeredPlayerIds.push(userId);

            this.broadcastMatchState(match);

            // Check if both attacker and defender have answered
            const { attackerId, defenderId } = match.attack;
            const attackerAnswered = match.question.answeredPlayerIds.includes(attackerId!);
            const defenderAnswered = match.question.answeredPlayerIds.includes(defenderId!);

            if (attackerAnswered && defenderAnswered) {
                this.resolveQuestion(match);
            }

            return this.sanitizeMatchState(match);
        });
    }

    // =====================================================
    // Question Resolution
    // =====================================================

    private resolveQuestion(match: ClassroomMatchState): void {
        if (!match.question || !match.attack.attackerId || !match.attack.defenderId) return;

        const { attackerId, defenderId, targetSeatIndex } = match.attack;

        const attackerScore = match.question.scoresByPlayerId[attackerId];
        const defenderScore = match.question.scoresByPlayerId[defenderId];

        const attackerRoundScore = attackerScore ?? 0;
        const defenderRoundScore = defenderScore ?? 0;

        // Since we don't track correct/incorrect explicitly anymore, we just infer from scores
        // or hardcode true/false based on > 0 if needed for backward compatibility in lastQuestionResult
        const attackerCorrect = attackerRoundScore > 0;
        const defenderCorrect = defenderRoundScore > 0;

        this.logger.log(
            `Match ${match.matchId}: Round resolved. Attacker score: ${attackerRoundScore}, Defender score: ${defenderRoundScore}`,
        );

        match.question = null;

        // Attacker wins if they score strictly higher than defender
        if (attackerRoundScore > defenderRoundScore) {
            // Attacker wins the round -> streak++
            match.attack.attackerStreakOnTarget++;

            if (match.attack.attackerStreakOnTarget >= CONQUEST_STREAK_REQUIRED) {
                // CONQUEST!
                match.lastQuestionResult = {
                    attackerId, defenderId,
                    attackerCorrect, defenderCorrect,
                    attackerRoundScore, defenderRoundScore,
                    outcome: 'conquered',
                    streakAfter: match.attack.attackerStreakOnTarget,
                    conqueredSeatIndex: targetSeatIndex!,
                    targetSeatIndex: targetSeatIndex!,
                    timestamp: Date.now(),
                };
                this.applyConquest(match, targetSeatIndex!, attackerId);
            } else {
                // Streak up but not yet conquered
                match.lastQuestionResult = {
                    attackerId, defenderId,
                    attackerCorrect, defenderCorrect,
                    attackerRoundScore, defenderRoundScore,
                    outcome: 'streak_up',
                    streakAfter: match.attack.attackerStreakOnTarget,
                    conqueredSeatIndex: null,
                    targetSeatIndex: targetSeatIndex!,
                    timestamp: Date.now(),
                };
                match.phase = 'attack';
            }
        } else {
            // Defender wins or ties (defender outscores or draws)
            // Attacker wrong -> streak reset, attack ends, next player's turn
            match.lastQuestionResult = {
                attackerId, defenderId,
                attackerCorrect, defenderCorrect,
                attackerRoundScore, defenderRoundScore,
                outcome: attackerRoundScore === defenderRoundScore && attackerCorrect ? 'both_correct' : 'defender_wins',
                streakAfter: 0,
                conqueredSeatIndex: null,
                targetSeatIndex: targetSeatIndex!,
                timestamp: Date.now(),
            };
            
            if (match.lastQuestionResult.outcome === 'both_correct') {
                // Per old design, both correct keeps turn. We will honor this for ties > 0.
                match.lastQuestionResult.streakAfter = match.attack.attackerStreakOnTarget;
                match.phase = 'attack';
            } else {
                 match.attack.attackerStreakOnTarget = 0;
                 match.attack = { attackerId: null, defenderId: null, targetSeatIndex: null, attackerStreakOnTarget: 0 };
                 match.phase = 'attack';
                 match.currentTurnPlayerId = this.getNextTurnPlayer(match);
                 match.turnCount++;
            }
        }

        this.broadcastMatchState(match);
        this.scheduleBotTurnIfNeeded(match);
    }

    // =====================================================
    // Conquest
    // =====================================================

    private applyConquest(match: ClassroomMatchState, seatIndex: number, newOwnerId: string): void {
        this.logger.log(`Match ${match.matchId}: Seat ${seatIndex} conquered by ${newOwnerId}`);

        match.grid[seatIndex].ownerPlayerId = newOwnerId;
        match.players = this.updateSeatCounts(match.players, match.grid);

        // Reset attack state
        match.attack = { attackerId: null, defenderId: null, targetSeatIndex: null, attackerStreakOnTarget: 0 };
        match.turnCount++;

        // Check win condition
        const owners = new Set(match.grid.map(s => s.ownerPlayerId).filter(Boolean));
        const activePlayers = match.players.filter(p => p.seatCount > 0);

        if (owners.size === 1 || activePlayers.length <= 1 || match.turnCount >= match.maxTurns) {
            // Game over!
            let winnerId: string | null = null;
            let reason = 'all_seats';

            if (owners.size === 1) {
                winnerId = match.grid[0].ownerPlayerId;
            } else if (activePlayers.length <= 1) {
                winnerId = activePlayers[0]?.id || null;
            } else {
                // Max turns failsafe — player with most seats wins
                winnerId = match.players.reduce((best, p) =>
                    p.seatCount > best.seatCount ? p : best,
                ).id;
                reason = 'max_turns';
            }

            match.phase = 'ended';
            match.result = {
                winnerId,
                reason,
                finalGrid: [...match.grid],
                seatCounts: Object.fromEntries(match.players.map(p => [p.id, p.seatCount])),
            };

            this.logger.log(`Match ${match.matchId}: Game over! Winner: ${winnerId} (${reason})`);
        } else {
            match.phase = 'attack';
            match.currentTurnPlayerId = this.getNextTurnPlayer(match);
        }
    }

    // =====================================================
    // Bot Automation
    // =====================================================

    private scheduleBotTurnIfNeeded(match: ClassroomMatchState): void {
        if (match.phase === 'ended') return;

        const currentPlayer = match.players.find(p => p.id === match.currentTurnPlayerId);
        if (!currentPlayer?.isBot) return;

        const rng = this.botRngs.get(match.matchId);
        if (!rng) return;

        const delay = Math.floor(500 + (rng() * 1000)); // 500-1500ms

        setTimeout(() => {
            this.executeBotTurn(match.matchId).catch(e =>
                this.logger.error(`Bot turn error: ${e.message}`),
            );
        }, delay);
    }

    private async executeBotTurn(matchId: string): Promise<void> {
        return this.runWithLock(matchId, async () => {
            const match = this.matches.get(matchId);
            if (!match) return;

            const currentPlayer = match.players.find(p => p.id === match.currentTurnPlayerId);
            if (!currentPlayer?.isBot) return;

            const rng = this.botRngs.get(matchId);
            if (!rng) return;

            if (match.phase === 'draft') {
                // Bot draft pick
                const seatIndex = this.botPickDraftSeat(match, currentPlayer.id, rng);
                if (seatIndex >= 0) {
                    // Apply draft pick directly (no API call needed for bots)
                    match.grid[seatIndex].ownerPlayerId = currentPlayer.id;
                    match.draft.currentPickIndex++;
                    if (match.draft.currentPickIndex >= match.players.length) {
                        match.draft.startingSeatsAssigned = true;
                    }
                    match.players = this.updateSeatCounts(match.players, match.grid);

                    const allOwned = match.grid.every(s => s.ownerPlayerId !== null);
                    if (allOwned) {
                        match.phase = 'attack';
                        match.currentTurnPlayerId = match.players[0].id;
                    } else {
                        const nextIdx = match.draft.currentPickIndex % match.players.length;
                        match.currentTurnPlayerId = match.players[nextIdx].id;
                    }

                    this.broadcastMatchState(match);
                    this.scheduleBotTurnIfNeeded(match);
                }
            } else if (match.phase === 'attack') {
                // Bot attack
                const targetIndex = this.botPickAttackTarget(match, currentPlayer.id, rng);
                if (targetIndex === null) {
                    // No valid targets — skip turn
                    match.currentTurnPlayerId = this.getNextTurnPlayer(match);
                    match.turnCount++;
                    this.broadcastMatchState(match);
                    this.scheduleBotTurnIfNeeded(match);
                    return;
                }

                // Execute attack (mimics attack() but internally)
                const targetSeat = match.grid[targetIndex];
                const defenderId = targetSeat.ownerPlayerId!;

                if (match.attack.targetSeatIndex !== targetIndex) {
                    match.attack.attackerStreakOnTarget = 0;
                }

                match.attack.attackerId = currentPlayer.id;
                match.attack.defenderId = defenderId;
                match.attack.targetSeatIndex = targetIndex;

                // Create question round
                match.question = {
                    startedAt: Date.now(),
                    endsAt: Date.now() + QUESTION_TIMER_MS,
                    scoresByPlayerId: {},
                    answeredPlayerIds: [],
                };

                for (const p of match.players) {
                    match.question.scoresByPlayerId[p.id] = null;
                }

                match.phase = 'question';
                this.broadcastMatchState(match);
                this.scheduleQuestionTimeout(match);
                this.scheduleBotAnswers(match);
            }
        });
    }

    private scheduleBotAnswers(match: ClassroomMatchState): void {
        if (!match.question) return;

        const rng = this.botRngs.get(match.matchId);
        if (!rng) return;

        const { attackerId, defenderId } = match.attack;
        const matchId = match.matchId;

        // Determine if a human is involved in this question (attacker or defender)
        const humanInvolved = match.players.some(
            p => !p.isBot && (p.id === attackerId || p.id === defenderId),
        );

        for (const player of match.players) {
            if (!player.isBot) continue;

            const botScore = Math.max(-2, Math.floor(rng() * 10) - 2); // Score between -2 and 7

            // Is this bot the attacker or defender in the current question?
            const isCombatant = player.id === attackerId || player.id === defenderId;

            if (isCombatant && humanInvolved) {
                // Bot is fighting a human — wait for the human to answer first,
                // then respond 1-2 seconds later, or after 80% of the timer.
                const botDelay = Math.floor(1000 + rng() * 1000); // 1-2s after human

                const pollInterval = setInterval(() => {
                    const currentMatch = this.matches.get(matchId);
                    if (!currentMatch || currentMatch.phase !== 'question' || !currentMatch.question) {
                        clearInterval(pollInterval);
                        return;
                    }

                    // Check if human opponent has answered
                    const humanId = attackerId === player.id ? defenderId : attackerId;
                    const humanAnswered = currentMatch.question.answeredPlayerIds.includes(humanId!);

                    // Or check if 80% of the question timer has passed
                    const elapsed = Date.now() - currentMatch.question.startedAt;
                    const timerThreshold = QUESTION_TIMER_MS * 0.8;

                    if (humanAnswered || elapsed >= timerThreshold) {
                        clearInterval(pollInterval);
                        setTimeout(() => {
                            this.submitBotAnswer(matchId, player.id, botScore).catch(e =>
                                this.logger.error(`Bot answer error: ${e.message}`),
                            );
                        }, humanAnswered ? botDelay : 500);
                    }
                }, 500);
            } else {
                // Bot is a spectator or both combatants are bots — answer quickly
                const delay = Math.floor(400 + rng() * 800);
                setTimeout(() => {
                    this.submitBotAnswer(matchId, player.id, botScore).catch(e =>
                        this.logger.error(`Bot answer error: ${e.message}`),
                    );
                }, delay);
            }
        }
    }

    private async submitBotAnswer(matchId: string, botId: string, score: number): Promise<void> {
        return this.runWithLock(matchId, async () => {
            const match = this.matches.get(matchId);
            if (!match || match.phase !== 'question' || !match.question) return;
            if (match.question.answeredPlayerIds.includes(botId)) return;

            match.question.scoresByPlayerId[botId] = score;
            match.question.answeredPlayerIds.push(botId);

            this.broadcastMatchState(match);

            const { attackerId, defenderId } = match.attack;
            const attackerAnswered = match.question.answeredPlayerIds.includes(attackerId!);
            const defenderAnswered = match.question.answeredPlayerIds.includes(defenderId!);

            if (attackerAnswered && defenderAnswered) {
                this.resolveQuestion(match);
            }
        });
    }

    private botPickDraftSeat(match: ClassroomMatchState, botId: string, rng: () => number): number {
        const empty = match.grid.filter(s => s.ownerPlayerId === null).map(s => s.index);
        if (empty.length === 0) return -1;

        const scored = empty.map(index => {
            const row = Math.floor(index / GRID_COLS);
            const col = index % GRID_COLS;
            const rowCenter = (GRID_ROWS - 1) / 2;
            const colCenter = (GRID_COLS - 1) / 2;
            const centrality = 1 / (1 + Math.abs(row - rowCenter) + Math.abs(col - colCenter));
            const neighbors = this.getNeighbors(index);
            const ownedNeighbors = neighbors.filter(n => match.grid[n].ownerPlayerId === botId).length;
            return { index, score: centrality + ownedNeighbors * 0.3 + rng() * 0.15 };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0].index;
    }

    private botPickAttackTarget(match: ClassroomMatchState, botId: string, rng: () => number): number | null {
        const targets = this.getValidAttackTargets(match.grid, botId);
        if (targets.length === 0) return null;

        const scored = targets.map(index => {
            const neighbors = this.getNeighbors(index);
            const botNeighbors = neighbors.filter(n => match.grid[n].ownerPlayerId === botId).length;
            const defenderSeatCount = match.grid.filter(s => s.ownerPlayerId === match.grid[index].ownerPlayerId).length;
            const weakness = 1 / (1 + defenderSeatCount);
            return { index, score: botNeighbors * 0.4 + weakness * 0.3 + rng() * 0.2 };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0].index;
    }

    // =====================================================
    // Question Timeout
    // =====================================================

    private scheduleQuestionTimeout(match: ClassroomMatchState): void {
        if (!match.question) return;

        const timeRemaining = match.question.endsAt - Date.now();
        if (timeRemaining <= 0) {
            this.handleQuestionTimeout(match.matchId);
            return;
        }

        setTimeout(() => {
            this.handleQuestionTimeout(match.matchId);
        }, timeRemaining + 500); // 500ms grace
    }

    private async handleQuestionTimeout(matchId: string): Promise<void> {
        return this.runWithLock(matchId, async () => {
            const match = this.matches.get(matchId);
            if (!match || match.phase !== 'question' || !match.question) return;

            // Time's up — treat unanswered as null score
            const { attackerId, defenderId } = match.attack;
            const attackerAnswered = match.question.answeredPlayerIds.includes(attackerId!);
            const defenderAnswered = match.question.answeredPlayerIds.includes(defenderId!);

            if (!attackerAnswered || !defenderAnswered) {
                // Fill in null scores for those who didn't answer
                if (!attackerAnswered && attackerId) {
                    match.question.scoresByPlayerId[attackerId] = null;
                    match.question.answeredPlayerIds.push(attackerId);
                }
                if (!defenderAnswered && defenderId) {
                    match.question.scoresByPlayerId[defenderId] = null;
                    match.question.answeredPlayerIds.push(defenderId);
                }

                this.resolveQuestion(match);
            }
        });
    }

    // =====================================================
    // Broadcasting
    // =====================================================

    private async broadcastMatchState(match: ClassroomMatchState): Promise<void> {
        try {
            const sanitized = this.sanitizeMatchState(match);
            const supabase = this.supabaseService.getAdminClient();
            const channel = supabase.channel(`classroom:${match.matchId}`);

            await channel.send({
                type: 'broadcast',
                event: 'match_state',
                payload: sanitized,
            });
        } catch (e) {
            this.logger.error(`Broadcast failed for match ${match.matchId}: ${e}`);
        }
    }

    private async broadcastRoomState(room: ClassroomRoom): Promise<void> {
        try {
            const supabase = this.supabaseService.getAdminClient();
            const channel = supabase.channel(`classroom_room:${room.code}`);

            await channel.send({
                type: 'broadcast',
                event: 'room_state',
                payload: room,
            });
        } catch (e) {
            this.logger.error(`Broadcast failed for room ${room.code}: ${e}`);
        }
    }

    private async broadcastToPlayer(userId: string, event: string, payload: any): Promise<void> {
        try {
            const supabase = this.supabaseService.getAdminClient();
            const channel = supabase.channel(`classroom_player:${userId}`);

            await channel.send({
                type: 'broadcast',
                event,
                payload,
            });
        } catch (e) {
            this.logger.error(`Player broadcast failed for ${userId}: ${e}`);
        }
    }

    // =====================================================
    // Sanitization
    // =====================================================

    /**
     * Remove sensitive data (like correct answers) from state
     * before sending to clients.
     */
    private sanitizeMatchState(match: ClassroomMatchState): any {
        const { question, ...rest } = match;

        if (!question) {
            return { ...rest, question: null };
        }

        // No sensitive data to remove under new protocol
        return match;
    }
}
