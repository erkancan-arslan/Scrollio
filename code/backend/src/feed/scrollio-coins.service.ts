import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

/** Credits `scrollio_coins_ledger` (playground currency) for the core app user. */
@Injectable()
export class ScrollioCoinsService {
  private readonly logger = new Logger(ScrollioCoinsService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Inserts a ledger row and returns the new balance via `get_user_coins`.
   * Transaction types: e.g. `feed_video_watch`, `feed_quiz_correct`, `game_reward`.
   */
  async awardCoins(
    userId: string,
    amount: number,
    transactionType: string,
    referenceId?: string,
  ): Promise<{ coinsAwarded: number; playgroundCoins: number } | null> {
    if (!userId || amount <= 0) return null;

    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin.from('scrollio_coins_ledger').insert({
      user_id: userId,
      amount,
      transaction_type: transactionType,
      reference_id: referenceId ?? null,
    });

    if (error) {
      this.logger.warn(`scrollio_coins_ledger insert failed: ${error.message}`);
      return null;
    }

    const playgroundCoins = await this.getBalance(admin, userId);
    return { coinsAwarded: amount, playgroundCoins };
  }

  private async getBalance(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    userId: string,
  ): Promise<number> {
    const { data, error } = await admin.rpc('get_user_coins', { target_user_id: userId });
    if (error) {
      this.logger.warn(`get_user_coins failed: ${error.message}`);
      return 0;
    }
    return typeof data === 'number' ? data : 0;
  }
}
