import {
    Injectable,
    Logger,
    OnModuleInit,
    OnModuleDestroy,
} from '@nestjs/common';
import { DuelService } from './duel.service';
import { SupabaseService } from '../supabase/supabase.service';

/**
 * DuelTickService
 *
 * Periodically settles timers for all active duel matches and broadcasts
 * state updates. Runs on a 250ms interval.
 *
 * This ensures matches progress even when neither player submits an answer,
 * and catches timer expiry in near-real-time.
 */
@Injectable()
export class DuelTickService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DuelTickService.name);
    private tickInterval: NodeJS.Timeout | null = null;

    /** How often to tick (ms) */
    private readonly TICK_INTERVAL_MS = 250;

    /** How often to broadcast timer updates even if nothing changed (ms) */
    private readonly BROADCAST_INTERVAL_MS = 1000;

    private lastBroadcastAt = 0;

    constructor(
        private readonly duelService: DuelService,
        private readonly supabaseService: SupabaseService,
    ) { }

    onModuleInit() {
        this.logger.log(
            `Starting duel tick service (interval: ${this.TICK_INTERVAL_MS}ms)`,
        );
        this.tickInterval = setInterval(() => this.tick(), this.TICK_INTERVAL_MS);
    }

    onModuleDestroy() {
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
        this.logger.log('Duel tick service stopped');
    }

    private async tick() {
        try {
            const supabase = this.supabaseService.getAdminClient();

            // Fetch all active match IDs
            const { data: activeMatches, error } = await supabase
                .from('duel_matches')
                .select('id')
                .eq('state', 'active');

            if (error || !activeMatches || activeMatches.length === 0) {
                return;
            }

            // Settle timers for each active match
            const promises = activeMatches.map((match) =>
                this.duelService
                    .settleAndCheckTimers(match.id)
                    .catch((err) =>
                        this.logger.error(
                            `Tick error for match ${match.id}:`,
                            err.message,
                        ),
                    ),
            );

            await Promise.all(promises);
        } catch (error) {
            this.logger.error('Tick cycle error:', error);
        }
    }
}
