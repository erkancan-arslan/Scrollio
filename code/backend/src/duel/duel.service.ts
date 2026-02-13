import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
    ConflictException,
    ForbiddenException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { DuelStateSnapshotDto } from './dto';
import {
    getCorrectAnswer,
    getBankVersion,
    getTotalQuestions,
    QUESTION_SET_ID,
} from './questionBank';
import {
    JokerId,
    JokerPlayerState,
    createDefaultJokerState,
    validateJokerUsage,
    expireEffects,
    hasActiveEffect,
    consumeEffect,
    getJokerDefinition,
    getAllJokerIds,
} from './jokerDefinitions';

/** Configurable grace window in ms for accepting late answers */
const DUEL_GRACE_MS = 500;

/** Initial timer for each player in ms */
const INITIAL_TIMER_MS = 30000;

/** Time bonus/penalty in ms */
const TIME_DELTA_MS = 1000;

@Injectable()
export class DuelService {
    private readonly logger = new Logger(DuelService.name);

    // In-memory mutex to prevent race conditions between ticks and user actions
    private locks = new Map<string, Promise<void>>();

    constructor(private readonly supabaseService: SupabaseService) { }

    /**
     * Run a task with an exclusive lock for a given matchId.
     */
    private async runWithLock<T>(matchId: string, task: () => Promise<T>): Promise<T> {
        // Wait for existing lock
        while (this.locks.has(matchId)) {
            try {
                await this.locks.get(matchId);
            } catch (e) {
                // Ignore errors from previous tasks
            }
        }

        // Create new lock
        let release: () => void;
        const lockPromise = new Promise<void>((resolve) => {
            release = resolve;
        });

        this.locks.set(matchId, lockPromise);

        try {
            return await task();
        } finally {
            this.locks.delete(matchId);
            release!();
        }
    }

    // ===================================================
    // DUEL REQUESTS
    // ===================================================

    /**
     * Create a duel request from one user to another.
     * Validates friendship exists and no duplicate pending request.
     */
    async createDuelRequest(
        fromUserId: string,
        toUserId: string,
    ): Promise<{ requestId: string }> {
        if (fromUserId === toUserId) {
            throw new BadRequestException('Cannot duel yourself');
        }

        const supabase = this.supabaseService.getAdminClient();

        // 1. Validate friendship
        const { data: friendship } = await supabase
            .from('friendships')
            .select('id, status')
            .or(
                `and(user_id.eq.${fromUserId},friend_id.eq.${toUserId}),and(user_id.eq.${toUserId},friend_id.eq.${fromUserId})`,
            )
            .eq('status', 'accepted')
            .limit(1)
            .single();

        if (!friendship) {
            throw new BadRequestException('You must be friends to send a duel request');
        }

        // 2. Expire any stale pending requests for this pair first
        await supabase
            .from('duel_requests')
            .update({ status: 'expired' })
            .eq('status', 'pending')
            .lt('expires_at', new Date().toISOString())
            .or(
                `and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`,
            );

        // 3. Check no pending request already exists between these users
        const { data: existing } = await supabase
            .from('duel_requests')
            .select('id')
            .eq('status', 'pending')
            .or(
                `and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`,
            )
            .limit(1);

        if (existing && existing.length > 0) {
            throw new ConflictException('A duel request is already pending between you two');
        }

        // 3. Create request with 30s TTL
        const expiresAt = new Date(Date.now() + 30_000).toISOString();
        const { data: request, error } = await supabase
            .from('duel_requests')
            .insert({
                from_user_id: fromUserId,
                to_user_id: toUserId,
                status: 'pending',
                expires_at: expiresAt,
            })
            .select()
            .single();

        if (error) {
            this.logger.error('Error creating duel request:', error);
            throw new Error(`Failed to create duel request: ${error.message}`);
        }

        // 4. Broadcast to the target user via Supabase Realtime
        await this.broadcastToChannel(`duel_requests:${toUserId}`, 'new_request', {
            requestId: request.id,
            fromUserId,
            expiresAt,
        });

        return { requestId: request.id };
    }

    /**
     * Respond to a duel request (accept / reject / cancel).
     */
    async respondDuelRequest(
        userId: string,
        requestId: string,
        action: 'accept' | 'reject' | 'cancel',
    ): Promise<{ matchId?: string }> {
        const supabase = this.supabaseService.getAdminClient();

        // 1. Fetch the request
        const { data: request, error: fetchError } = await supabase
            .from('duel_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !request) {
            throw new NotFoundException('Duel request not found');
        }

        if (request.status !== 'pending') {
            throw new ConflictException(`Request is already ${request.status}`);
        }

        // Check expiry
        if (new Date(request.expires_at) <= new Date()) {
            await supabase
                .from('duel_requests')
                .update({ status: 'expired' })
                .eq('id', requestId);
            throw new ConflictException('Duel request has expired');
        }

        // 2. Validate permissions
        if (action === 'cancel') {
            if (request.from_user_id !== userId) {
                throw new ForbiddenException('Only the sender can cancel');
            }
        } else {
            if (request.to_user_id !== userId) {
                throw new ForbiddenException('Only the recipient can accept or reject');
            }
        }

        // 3. Handle action
        if (action === 'accept') {
            return this.acceptDuelRequest(request);
        }

        // Reject or cancel
        const newStatus = action === 'cancel' ? 'canceled' : 'rejected';
        await supabase
            .from('duel_requests')
            .update({ status: newStatus })
            .eq('id', requestId);

        // Notify both parties so UI updates for sender and receiver
        await this.broadcastToChannel(
            `duel_requests:${request.from_user_id}`,
            'request_update',
            { requestId, status: newStatus },
        );
        await this.broadcastToChannel(
            `duel_requests:${request.to_user_id}`,
            'request_update',
            { requestId, status: newStatus },
        );

        return {};
    }

    /**
     * Internal: Accept a duel request and create a match.
     */
    private async acceptDuelRequest(
        request: any,
    ): Promise<{ matchId: string }> {
        const supabase = this.supabaseService.getAdminClient();

        const seed = Date.now() % 2_147_483_647; // Keep within PostgreSQL integer range
        const bankVersion = getBankVersion();

        // 1. Create the match with joker state
        const defaultJokerState = createDefaultJokerState();
        const jokerConfig = {
            allowedJokers: getAllJokerIds(),
            usesPerJoker: 1,
        };

        const { data: match, error: matchError } = await supabase
            .from('duel_matches')
            .insert({
                player_a_id: request.from_user_id,
                player_b_id: request.to_user_id,
                state: 'active',
                seed,
                question_set_id: QUESTION_SET_ID,
                bank_version: bankVersion,
                start_time: new Date().toISOString(),
                remaining_ms_a: INITIAL_TIMER_MS,
                remaining_ms_b: INITIAL_TIMER_MS,
                current_question_index: 0,
                player_a_answered: false,
                player_b_answered: false,
                last_tick_at: new Date().toISOString(),
                joker_config: jokerConfig,
                player_a_jokers: defaultJokerState,
                player_b_jokers: defaultJokerState,
            })
            .select()
            .single();

        if (matchError) {
            this.logger.error('Error creating duel match:', matchError);
            throw new Error(`Failed to create match: ${matchError.message}`);
        }

        // 2. Update the request
        await supabase
            .from('duel_requests')
            .update({ status: 'accepted', match_id: match.id })
            .eq('id', request.id);

        // 3. Log match start event
        await supabase.from('duel_events').insert({
            match_id: match.id,
            type: 'match_start',
            payload: { seed, question_set_id: QUESTION_SET_ID, bank_version: bankVersion },
        });

        // 4. Build snapshot and broadcast
        const snapshot = this.buildSnapshot(match);

        await this.broadcastToChannel(
            `duel_match:${match.id}`,
            'match_started',
            snapshot,
        );

        // 5. Notify both players via their request channels
        await this.broadcastToChannel(
            `duel_requests:${request.from_user_id}`,
            'request_update',
            { requestId: request.id, status: 'accepted', matchId: match.id },
        );
        await this.broadcastToChannel(
            `duel_requests:${request.to_user_id}`,
            'request_update',
            { requestId: request.id, status: 'accepted', matchId: match.id },
        );

        return { matchId: match.id };
    }

    // ===================================================
    // JOKER USAGE
    // ===================================================

    /**
     * Use a joker during a duel match. Server-authoritative.
     */
    async useDuelJoker(
        userId: string,
        matchId: string,
        jokerId: JokerId,
    ): Promise<DuelStateSnapshotDto> {
        return this.runWithLock(matchId, async () => {
            const supabase = this.supabaseService.getAdminClient();

            const { data: match, error } = await supabase
                .from('duel_matches')
                .select('*')
                .eq('id', matchId)
                .single();

            if (error || !match) throw new NotFoundException('Match not found');
            if (match.state !== 'active') throw new ConflictException(`Match is ${match.state}`);

            const isPlayerA = match.player_a_id === userId;
            const isPlayerB = match.player_b_id === userId;
            if (!isPlayerA && !isPlayerB) throw new ForbiddenException('Not a participant');

            // Settle timers first
            const now = Date.now();
            const lastTickAt = new Date(match.last_tick_at).getTime();
            const elapsedMs = now - lastTickAt;
            let remainingA = match.remaining_ms_a - elapsedMs;
            let remainingB = match.remaining_ms_b - elapsedMs;

            // Parse joker states
            const playerJokers: JokerPlayerState =
                isPlayerA ? { ...match.player_a_jokers } : { ...match.player_b_jokers };
            const opponentJokers: JokerPlayerState =
                isPlayerA ? { ...match.player_b_jokers } : { ...match.player_a_jokers };

            // Expire old effects
            expireEffects(playerJokers, now);
            expireEffects(opponentJokers, now);

            // Validate usage
            const opponentRemaining = isPlayerA ? remainingB : remainingA;
            const validationError = validateJokerUsage(jokerId, playerJokers, opponentRemaining);
            if (validationError) throw new BadRequestException(validationError);

            // Apply joker effect
            const def = getJokerDefinition(jokerId);

            switch (jokerId) {
                case 'SHIELD':
                    playerJokers.activeEffects.push({
                        type: 'SHIELD',
                        expiresAt: now + def.durationMs,
                    });
                    break;

                case 'FREEZE':
                    opponentJokers.controlsLockedUntil = now + def.durationMs;
                    // Also add as an active effect for visibility
                    opponentJokers.activeEffects.push({
                        type: 'FREEZE',
                        expiresAt: now + def.durationMs,
                    });
                    break;

                case 'CLEANSE':
                    playerJokers.controlsLockedUntil = null;
                    playerJokers.activeEffects = playerJokers.activeEffects.filter(
                        (e) => e.type !== 'FREEZE',
                    );
                    break;
            }

            // Decrement uses and record timestamp
            playerJokers.remainingUses[jokerId] = (playerJokers.remainingUses[jokerId] ?? 1) - 1;
            playerJokers.lastUsedAt[jokerId] = now;

            // Build update
            const update: any = {
                remaining_ms_a: remainingA,
                remaining_ms_b: remainingB,
                last_tick_at: new Date(now).toISOString(),
            };
            if (isPlayerA) {
                update.player_a_jokers = playerJokers;
                update.player_b_jokers = opponentJokers;
            } else {
                update.player_b_jokers = playerJokers;
                update.player_a_jokers = opponentJokers;
            }

            const { data: updatedMatch, error: updateError } = await supabase
                .from('duel_matches')
                .update(update)
                .eq('id', matchId)
                .select()
                .single();

            if (updateError) {
                this.logger.error('Error updating match for joker:', updateError);
                throw new Error(`Failed to use joker: ${updateError.message}`);
            }

            // Log event
            await supabase.from('duel_events').insert({
                match_id: matchId,
                type: 'joker_used',
                payload: {
                    player_id: userId,
                    joker_id: jokerId,
                    applied_effects: jokerId === 'FREEZE'
                        ? { controlsLockedUntil: opponentJokers.controlsLockedUntil }
                        : jokerId === 'SHIELD'
                            ? { shieldExpiresAt: now + def.durationMs }
                            : { cleansed: true },
                },
            });

            // Broadcast
            const snapshot = this.buildSnapshot(updatedMatch);
            await this.broadcastToChannel(
                `duel_match:${matchId}`,
                'state_update',
                snapshot,
            );

            return snapshot;
        });
    }



    // ===================================================
    // JOIN / READY
    // ===================================================

    /**
     * Join a match and mark as ready.
     * Transitions match to 'active' if both players are ready.
     */
    async joinMatch(
        userId: string,
        matchId: string,
    ): Promise<DuelStateSnapshotDto> {
        const supabase = this.supabaseService.getAdminClient();

        // 1. Fetch match
        const { data: match, error } = await supabase
            .from('duel_matches')
            .select('*')
            .eq('id', matchId)
            .single();

        if (error || !match) {
            throw new NotFoundException('Match not found');
        }

        const isPlayerA = match.player_a_id === userId;
        const isPlayerB = match.player_b_id === userId;

        if (!isPlayerA && !isPlayerB) {
            throw new ForbiddenException('Not a participant');
        }

        // 2. If already active or finished, just return state
        if (match.state !== 'waiting') {
            return this.getDuelMatchState(userId, matchId);
        }

        // 3. Mark ready
        const update: any = {};
        if (isPlayerA && !match.ready_a) update.ready_a = true;
        if (isPlayerB && !match.ready_b) update.ready_b = true;

        // If no change needed, return current state
        if (Object.keys(update).length === 0) {
            return this.buildSnapshot(match);
        }

        // 4. Check if this makes both ready
        const readyA = isPlayerA ? true : match.ready_a;
        const readyB = isPlayerB ? true : match.ready_b;

        if (readyA && readyB) {
            update.state = 'active';
            update.start_time = new Date().toISOString();
            update.last_tick_at = update.start_time;
        }

        // 5. Update DB
        const { data: updatedMatch, error: updateError } = await supabase
            .from('duel_matches')
            .update(update)
            .eq('id', matchId)
            .select()
            .single();

        if (updateError) {
            throw new Error(`Failed to update match join state: ${updateError.message}`);
        }

        // 6. Broadcast update
        const snapshot = this.buildSnapshot(updatedMatch);
        const event = updatedMatch.state === 'active' ? 'match_started' : 'state_update';

        await this.broadcastToChannel(
            `duel_match:${matchId}`,
            event,
            snapshot,
        );

        return snapshot;
    }

    // ===================================================
    // DUEL ANSWERS
    // ===================================================

    /**
     * Helper: Get player role (A or B) or throw if not participant
     */
    private getRole(match: any, userId: string): 'A' | 'B' {
        if (match.player_a_id === userId) return 'A';
        if (match.player_b_id === userId) return 'B';
        throw new ForbiddenException('You are not a participant in this match');
    }

    /**
     * Submit a duel answer. Server-authoritative.
     */
    async submitDuelAnswer(
        userId: string,
        matchId: string,
        questionIndex: number,
        answer: boolean,
    ): Promise<DuelStateSnapshotDto> {
        return this.runWithLock(matchId, async () => {
            const startTick = Date.now();
            const supabase = this.supabaseService.getAdminClient();

            // 1. Fetch match with row locking intent
            const { data: match, error: fetchError } = await supabase
                .from('duel_matches')
                .select('*')
                .eq('id', matchId)
                .single();

            if (fetchError || !match) {
                throw new NotFoundException('Match not found');
            }

            // 1b. Validate State
            if (match.state !== 'active') {
                this.logger.warn(`[submitDuelAnswer] Match ${matchId} not active (state: ${match.state})`);
                throw new ConflictException(`Match is ${match.state}, cannot submit answer`);
            }

            // 2. Determine Role
            const role = this.getRole(match, userId);
            const isPlayerA = role === 'A';

            // 3. Idempotency Check
            const alreadyAnswered = isPlayerA ? match.player_a_answered : match.player_b_answered;
            if (alreadyAnswered) {
                this.logger.log(`[submitDuelAnswer] Idempotent hit for match ${matchId} player ${userId}`);
                return this.buildSnapshot(match);
            }

            // 4. Validate Question Index
            if (questionIndex !== match.current_question_index) {
                this.logger.warn(`[submitDuelAnswer] Index mismatch. Server: ${match.current_question_index}, Client: ${questionIndex}`);
                throw new BadRequestException(
                    `Question index mismatch: expected ${match.current_question_index}, got ${questionIndex}`,
                );
            }

            // =================================================================
            // CORE TIMER LOGIC
            // =================================================================

            // 5. SETTLE TIMERS (Account for elapsed time since last server update)
            // We use the DB's last_tick_at to calculate how much time has passed
            // and subtract that from the persisted remaining time.
            const now = Date.now();
            const lastTickAt = new Date(match.last_tick_at).getTime();
            const elapsedMs = Math.max(0, now - lastTickAt); // Prevent negative elapsed

            this.logger.log(`[submitDuelAnswer][${matchId}] Settling timers. Now: ${now}, LastTick: ${lastTickAt} (${match.last_tick_at}). Elapsed: ${elapsedMs}ms.`);

            // SAFEGUARD: If elapsed time is suspiciously large (e.g. server restart), ignore it to prevent instant timeout
            let remainingA: number;
            let remainingB: number;

            if (elapsedMs > 5000) {
                this.logger.warn(`[submitDuelAnswer] Suspect elapsed time (${elapsedMs}ms). Capping to 0ms to prevent restart-timeout.`);
                // We could set it to 0 or a small tick. Let's use 0 to be safe.
                // However, we MUST perform the update to advance last_tick_at to now.
                // Reset variables to match current state without penalty.
                remainingA = match.remaining_ms_a;
                remainingB = match.remaining_ms_b;
            } else {
                // Only subtract time if the player has NOT answered yet.
                // If they have answered, their clock should be paused while waiting.
                remainingA = match.player_a_answered ? match.remaining_ms_a : match.remaining_ms_a - elapsedMs;
                remainingB = match.player_b_answered ? match.remaining_ms_b : match.remaining_ms_b - elapsedMs;
            }

            this.logger.log(`[submitDuelAnswer] Pre-Settle: A=${match.remaining_ms_a}, B=${match.remaining_ms_b}. Post-Settle: A=${remainingA}, B=${remainingB}`);

            // 6. Parse Jokers & Check FREEZE
            const jokersA: JokerPlayerState = match.player_a_jokers || createDefaultJokerState();
            const jokersB: JokerPlayerState = match.player_b_jokers || createDefaultJokerState();

            // Allow expireEffects to update state in place
            expireEffects(jokersA, now);
            expireEffects(jokersB, now);

            const myJokers = isPlayerA ? jokersA : jokersB;
            const opponentJokers = isPlayerA ? jokersB : jokersA;

            if (myJokers.controlsLockedUntil && myJokers.controlsLockedUntil > now) {
                this.logger.warn(`[submitDuelAnswer] Player ${userId} is FROZEN until ${myJokers.controlsLockedUntil}`);
                throw new ConflictException('Controls locked — you are frozen');
            }

            // 7. Check Correctness
            // Note: We used a fixed seed in example, but real implementation uses seed from match
            const correctAnswer = getCorrectAnswer(match.seed, match.current_question_index);
            const isCorrect = answer === correctAnswer;

            // 8. Apply Deltas
            // Correct: Self +1000, Oppt -1000
            // Wrong: Self -1000, Oppt 0
            let deltaSelfMs = 0;
            let deltaOppMs = 0;

            if (isCorrect) {
                deltaSelfMs = TIME_DELTA_MS;
                deltaOppMs = -TIME_DELTA_MS;

                // Handle Shield
                if (hasActiveEffect(opponentJokers, 'SHIELD')) {
                    consumeEffect(opponentJokers, 'SHIELD');
                    deltaOppMs = 0;
                    this.logger.log(`[submitDuelAnswer] SHIELD blocked damage to opponent`);
                }
            } else {
                deltaSelfMs = -TIME_DELTA_MS;
                deltaOppMs = 0;
            }

            this.logger.log(`[submitDuelAnswer] Result: ${isCorrect ? 'CORRECT' : 'WRONG'}. DeltaSelf: ${deltaSelfMs}, DeltaOpp: ${deltaOppMs}`);

            if (isPlayerA) {
                remainingA += deltaSelfMs;
                remainingB += deltaOppMs;
            } else {
                remainingB += deltaSelfMs;
                remainingA += deltaOppMs;
            }

            // Clamp to 0 (optional, but good for cleanliness before game over check)
            // Actually, we usually allow negative momentarily before declaring game over, 
            // but let's clamp for display sanity, knowing <=0 checks happen next.
            // remainingA = Math.max(0, remainingA); 
            // remainingB = Math.max(0, remainingB); 
            // -> Decide: If we clamp here, we can't distinguish "just hit 0" from "way below 0".
            // Let's NOT clamp yet, check game over, then clamp for DB storage if game continues?
            // Strictly speaking, if remainingA <= 0, game ends.

            // 9. Update State for this Question
            const update: any = {
                last_tick_at: new Date(now).toISOString(),
                player_a_jokers: jokersA,
                player_b_jokers: jokersB,
            };

            if (isPlayerA) update.player_a_answered = true;
            else update.player_b_answered = true;

            // Check if both answered -> advance
            const otherAnswered = isPlayerA ? match.player_b_answered : match.player_a_answered;
            if (otherAnswered) {
                update.current_question_index = match.current_question_index + 1;
                update.player_a_answered = false;
                update.player_b_answered = false;
            }

            // 10. Check Game Over
            let gameOver = false;
            let finalWinnerId: string | null = null;
            let finishReason: string | null = null;

            if (remainingA <= 0 && remainingB <= 0) {
                gameOver = true;
                finishReason = 'timeout_both';
                // Tiebreaker: who has more time (even if both negative)? or Draw?
                // Let's say pure draw if both <= 0 in same tick
                if (remainingA > remainingB) finalWinnerId = match.player_a_id;
                else if (remainingB > remainingA) finalWinnerId = match.player_b_id;
                else finalWinnerId = null;
            } else if (remainingA <= 0) {
                gameOver = true;
                finalWinnerId = match.player_b_id;
                finishReason = 'timeout_a';
            } else if (remainingB <= 0) {
                gameOver = true;
                finalWinnerId = match.player_a_id;
                finishReason = 'timeout_b';
            }

            // Check max questions
            const nextIndex = update.current_question_index ?? match.current_question_index;
            if (!gameOver && nextIndex >= getTotalQuestions()) {
                gameOver = true;
                finishReason = 'questions_exhausted';
                if (remainingA > remainingB) finalWinnerId = match.player_a_id;
                else if (remainingB > remainingA) finalWinnerId = match.player_b_id;
                else finalWinnerId = null;
            }

            if (gameOver) {
                update.state = 'finished';
                update.winner_id = finalWinnerId;
                update.finish_reason = finishReason;
                // Clamp for final storage
                update.remaining_ms_a = Math.max(0, remainingA);
                update.remaining_ms_b = Math.max(0, remainingB);
            } else {
                update.remaining_ms_a = remainingA;
                update.remaining_ms_b = remainingB;
            }

            this.logger.log(`[submitDuelAnswer] Final Timers: A=${update.remaining_ms_a}, B=${update.remaining_ms_b}. Game Over: ${gameOver}`);

            // 11. Persist Update
            const { data: updatedMatch, error: updateError } = await supabase
                .from('duel_matches')
                .update(update)
                .eq('id', matchId)
                .select()
                .single();

            if (updateError) {
                this.logger.error(`[submitDuelAnswer] DB Update Error: ${updateError.message}`);
                throw new Error(`Failed to update match: ${updateError.message}`);
            }

            // 12. Log Event (Async)
            // We await it to ensure order, or fire and forget? 
            // Better await to ensure consistency in logs
            await supabase.from('duel_events').insert({
                match_id: matchId,
                type: gameOver ? 'match_end' : 'answer',
                payload: {
                    player_id: userId,
                    question_index: questionIndex,
                    answer_given: answer,
                    is_correct: isCorrect,
                    delta_self: deltaSelfMs,
                    delta_opp: deltaOppMs,
                    timers_before: { a: match.remaining_ms_a, b: match.remaining_ms_b },
                    timers_after: { a: remainingA, b: remainingB },
                    winner_id: finalWinnerId
                },
            });

            // 13. Broadcast
            const snapshot = this.buildSnapshot(updatedMatch);
            const eventType = gameOver ? 'match_ended' : 'state_update';
            await this.broadcastToChannel(
                `duel_match:${matchId}`,
                eventType,
                snapshot,
            );

            return snapshot;
        });
    }

    // ===================================================
    // TIMER SETTLEMENT (called by tick service)
    // ===================================================

    /**
     * Settle timers for an active match and check for expiry.
     * Called periodically by the tick service.
     */
    async settleAndCheckTimers(matchId: string): Promise<void> {
        return this.runWithLock(matchId, async () => {
            const supabase = this.supabaseService.getAdminClient();

            const { data: match, error } = await supabase
                .from('duel_matches')
                .select('*')
                .eq('id', matchId)
                .eq('state', 'active')
                .single();

            if (error || !match) return; // Match not found or not active

            const now = Date.now();
            const lastTickAt = new Date(match.last_tick_at).getTime();
            const elapsedMs = now - lastTickAt;

            // Don't settle if very little time has passed (avoid unnecessary updates)
            if (elapsedMs < 100) return;

            let remainingA = match.remaining_ms_a;
            let remainingB = match.remaining_ms_b;

            // SAFEGUARD: If server restarted or hanged, elapsedMs might be huge (e.g. 10 mins).
            // Prevent draining the entire timer in one tick.
            if (elapsedMs > 5000) {
                this.logger.warn(`[settleAndCheckTimers][${matchId}] Suspect large elapsed time (${elapsedMs}ms). Ignoring penalty.`);
                // Do not subtract elapsedMs. 
                // We will still update last_tick_at below, effectively "skipping" the downtime.
            } else {
                // crucial fix: Only subtract time if the player has NOT answered yet.
                remainingA = match.player_a_answered ? match.remaining_ms_a : match.remaining_ms_a - elapsedMs;
                remainingB = match.player_b_answered ? match.remaining_ms_b : match.remaining_ms_b - elapsedMs;
            }

            // Expire joker effects during tick
            const jokersA: JokerPlayerState = match.player_a_jokers || createDefaultJokerState();
            const jokersB: JokerPlayerState = match.player_b_jokers || createDefaultJokerState();
            const hadEffectsA = jokersA.activeEffects.length > 0 || jokersA.controlsLockedUntil;
            const hadEffectsB = jokersB.activeEffects.length > 0 || jokersB.controlsLockedUntil;
            expireEffects(jokersA, now);
            expireEffects(jokersB, now);

            // Check game over
            if (remainingA <= 0 || remainingB <= 0) {
                await this.finalizeMatch(match, supabase, remainingA, remainingB);
                return;
            }

            // Build tick update — include joker states if effects changed
            const tickUpdate: any = {
                remaining_ms_a: remainingA,
                remaining_ms_b: remainingB,
                last_tick_at: new Date(now).toISOString(),
            };
            if (hadEffectsA || hadEffectsB) {
                tickUpdate.player_a_jokers = jokersA;
                tickUpdate.player_b_jokers = jokersB;
            }

            // Update tick timestamp and broadcast current state
            const { error: tickError } = await supabase
                .from('duel_matches')
                .update(tickUpdate)
                .eq('id', matchId);

            if (tickError) {
                this.logger.error(`[settleAndCheckTimers] DB Update Failed: ${tickError.message}`);
                // If update failed, last_tick_at won't move. Next tick will have double duration.
                // We can't do much but log it.
            }

            // Broadcast tick
            const snapshot: DuelStateSnapshotDto = {
                matchId: match.id,
                state: 'active',
                remainingMsA: remainingA,
                remainingMsB: remainingB,
                currentQuestionIndex: match.current_question_index,
                playerAAnswered: match.player_a_answered,
                playerBAnswered: match.player_b_answered,
                winnerId: null,
                finishReason: null,
                serverTime: now,
                playerAId: match.player_a_id,
                playerBId: match.player_b_id,
                startTime: match.start_time ? new Date(match.start_time).getTime() : null,
                readyA: match.ready_a || false,
                readyB: match.ready_b || false,
                seed: match.seed,
                questionSetId: match.question_set_id,
                bankVersion: match.bank_version,
                playerAJokers: jokersA,
                playerBJokers: jokersB,
            };

            await this.broadcastToChannel(
                `duel_match:${matchId}`,
                'state_update',
                snapshot,
            );
        });
    }

    // ===================================================
    // MATCH STATE RETRIEVAL (for reconnect)
    // ===================================================

    /**
     * Get current match state. Used for reconnection.
     */
    async getDuelMatchState(
        userId: string,
        matchId: string,
    ): Promise<DuelStateSnapshotDto> {
        const supabase = this.supabaseService.getAdminClient();

        const { data: match, error } = await supabase
            .from('duel_matches')
            .select('*')
            .eq('id', matchId)
            .single();

        if (error || !match) {
            throw new NotFoundException('Match not found');
        }

        if (match.player_a_id !== userId && match.player_b_id !== userId) {
            throw new ForbiddenException('You are not a participant in this match');
        }

        // If match is active, settle timers first
        if (match.state === 'active') {
            const now = Date.now();
            const lastTickAt = new Date(match.last_tick_at).getTime();
            const elapsedMs = now - lastTickAt;

            const snapshot = this.buildSnapshot(match);
            snapshot.remainingMsA -= elapsedMs;
            snapshot.remainingMsB -= elapsedMs;
            snapshot.serverTime = now;
            return snapshot;
        }

        return this.buildSnapshot(match);
    }

    /**
     * Get pending incoming duel requests for a user.
     */
    async getPendingDuelRequests(userId: string) {
        const supabase = this.supabaseService.getAdminClient();

        // First expire any old requests
        try {
            await supabase.rpc('expire_duel_requests');
        } catch {
            // Non-critical — ignore expiry failures
        }

        // Fetch pending requests (no profile join — no FK exists)
        const { data, error } = await supabase
            .from('duel_requests')
            .select('id, from_user_id, to_user_id, status, created_at, expires_at, match_id')
            .or(`to_user_id.eq.${userId},from_user_id.eq.${userId}`)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) {
            this.logger.error('Error fetching duel requests:', error);
            return { requests: [], total: 0 };
        }

        if (!data || data.length === 0) {
            return { requests: [], total: 0 };
        }

        // Resolve sender profiles in a separate query
        const senderIds = [...new Set(data.map((r) => r.from_user_id))];
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id, display_name, avatar_url')
            .in('id', senderIds);

        const profileMap = new Map(
            (profiles || []).map((p) => [p.id, p]),
        );

        const enriched = data.map((r) => ({
            ...r,
            sender_profile: profileMap.get(r.from_user_id) || null,
        }));

        return { requests: enriched, total: enriched.length };
    }


    // ===================================================
    // HELPERS
    // ===================================================

    /**
     * Finalize a match (set winner, state=finished).
     */
    private async finalizeMatch(
        match: any,
        supabase: any,
        remainingA: number,
        remainingB: number,
    ): Promise<DuelStateSnapshotDto> {
        let winnerId: string | null = null;
        let finishReason: string;

        if (remainingA <= 0 && remainingB <= 0) {
            winnerId =
                remainingA > remainingB
                    ? match.player_a_id
                    : remainingB > remainingA
                        ? match.player_b_id
                        : null;
            finishReason = 'timeout_both';
        } else if (remainingA <= 0) {
            winnerId = match.player_b_id;
            finishReason = 'timeout_a';
        } else {
            winnerId = match.player_a_id;
            finishReason = 'timeout_b';
        }

        const now = Date.now();

        const { data: updatedMatch } = await supabase
            .from('duel_matches')
            .update({
                state: 'finished',
                remaining_ms_a: Math.max(0, remainingA),
                remaining_ms_b: Math.max(0, remainingB),
                winner_id: winnerId,
                finish_reason: finishReason,
                last_tick_at: new Date(now).toISOString(),
            })
            .eq('id', match.id)
            .select()
            .single();

        // Log match end event
        await supabase.from('duel_events').insert({
            match_id: match.id,
            type: 'match_end',
            payload: {
                winner_id: winnerId,
                finish_reason: finishReason,
                final_ms_a: Math.max(0, remainingA),
                final_ms_b: Math.max(0, remainingB),
            },
        });

        const snapshot = this.buildSnapshot(updatedMatch || { ...match, state: 'finished', winner_id: winnerId, finish_reason: finishReason });

        await this.broadcastToChannel(
            `duel_match:${match.id}`,
            'match_ended',
            snapshot,
        );

        return snapshot;
    }

    /**
     * Build a DuelStateSnapshotDto from a match DB row.
     */
    private buildSnapshot(match: any): DuelStateSnapshotDto {
        return {
            matchId: match.id,
            state: match.state,
            remainingMsA: match.remaining_ms_a,
            remainingMsB: match.remaining_ms_b,
            currentQuestionIndex: match.current_question_index,
            playerAAnswered: match.player_a_answered,
            playerBAnswered: match.player_b_answered,
            winnerId: match.winner_id || null,
            finishReason: match.finish_reason || null,
            serverTime: Date.now(),
            startTime: match.start_time ? new Date(match.start_time).getTime() : null,
            playerAId: match.player_a_id,
            playerBId: match.player_b_id,
            readyA: match.ready_a || false,
            readyB: match.ready_b || false,
            seed: match.seed,
            questionSetId: match.question_set_id,
            bankVersion: match.bank_version,
            playerAJokers: match.player_a_jokers || createDefaultJokerState(),
            playerBJokers: match.player_b_jokers || createDefaultJokerState(),
        };
    }

    /**
     * Broadcast a message to a Supabase Realtime channel.
     */
    private async broadcastToChannel(
        channelName: string,
        event: string,
        payload: any,
    ): Promise<void> {
        try {
            const supabase = this.supabaseService.getAdminClient();
            const channel = supabase.channel(channelName);

            await channel.send({
                type: 'broadcast',
                event,
                payload,
            });

            // Clean up the channel subscription
            await supabase.removeChannel(channel);
        } catch (error) {
            this.logger.error(
                `Failed to broadcast to ${channelName}:${event}`,
                error,
            );
        }
    }
}
