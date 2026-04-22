import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { SetScreenTimeDto, UpdateContentFiltersDto } from './dto';

@Injectable()
export class KidsParentalService {
  private readonly logger = new Logger(KidsParentalService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Get recent activity log entries for a child.
   */
  async getActivity(childId: string, page = 1, limit = 50) {
    const admin = this.supabaseService.getAdminClient();
    const offset = (page - 1) * limit;

    const { data, count, error } = await admin
      .from('kids_activity_logs')
      .select('*', { count: 'exact' })
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`getActivity error: ${error.message}`);
    }

    return {
      data: data ?? [],
      meta: { page, limit, total: count ?? 0 },
    };
  }

  /**
   * Get screen time settings and today's usage for a child.
   */
  async getScreenTime(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    // Get settings
    const { data: settings } = await admin
      .from('kids_parental_settings')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    // Calculate today's usage from feed_views
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: views } = await admin
      .from('kids_feed_views')
      .select('watched_seconds')
      .eq('child_profile_id', childId)
      .gte('created_at', todayStart.toISOString());

    const totalSecondsToday = (views ?? []).reduce(
      (sum: number, v: { watched_seconds: number }) => sum + (v.watched_seconds ?? 0),
      0,
    );
    const usedMinutesToday = Math.round(totalSecondsToday / 60);

    // Get screen time rules
    const { data: rules } = await admin
      .from('kids_screen_time_rules')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    const dailyLimitMinutes = (rules?.daily_limit_minutes as number) ?? 60;

    return {
      dailyLimitMinutes,
      usedMinutesToday,
      remainingMinutes: Math.max(0, dailyLimitMinutes - usedMinutesToday),
      allowedStartTime: (rules?.allowed_start_time as string) ?? '08:00',
      allowedEndTime: (rules?.allowed_end_time as string) ?? '20:00',
      isLimitReached: usedMinutesToday >= dailyLimitMinutes,
    };
  }

  /**
   * Set screen time rules for a child.
   */
  async setScreenTime(childId: string, dto: SetScreenTimeDto) {
    const admin = this.supabaseService.getAdminClient();

    const { error } = await admin.from('kids_screen_time_rules').upsert(
      {
        child_profile_id: childId,
        daily_limit_minutes: dto.dailyLimitMinutes,
        allowed_start_time: dto.allowedStartTime ?? '08:00',
        allowed_end_time: dto.allowedEndTime ?? '20:00',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_profile_id' },
    );

    if (error) {
      this.logger.error(`setScreenTime error: ${error.message}`);
    }

    return this.getScreenTime(childId);
  }

  /**
   * Get content filter settings for a child.
   */
  async getContentFilters(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data: settings } = await admin
      .from('kids_parental_settings')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (!settings) {
      return {
        blockedTopicIds: [],
        maxDifficulty: 'hard',
        safeSearchEnabled: true,
      };
    }

    const config = (settings.settings ?? {}) as Record<string, unknown>;
    return {
      blockedTopicIds: (config.blockedTopicIds ?? []) as string[],
      maxDifficulty: (config.maxDifficulty ?? 'hard') as string,
      safeSearchEnabled: (config.safeSearchEnabled ?? true) as boolean,
    };
  }

  /**
   * Update content filter settings for a child.
   */
  async updateContentFilters(childId: string, dto: UpdateContentFiltersDto) {
    const admin = this.supabaseService.getAdminClient();

    // Get current settings
    const { data: existing } = await admin
      .from('kids_parental_settings')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    const currentSettings = ((existing?.settings ?? {}) as Record<string, unknown>);
    const newSettings = {
      ...currentSettings,
      ...(dto.blockedTopicIds !== undefined ? { blockedTopicIds: dto.blockedTopicIds } : {}),
      ...(dto.maxDifficulty !== undefined ? { maxDifficulty: dto.maxDifficulty } : {}),
      ...(dto.safeSearchEnabled !== undefined ? { safeSearchEnabled: dto.safeSearchEnabled } : {}),
    };

    const { error } = await admin.from('kids_parental_settings').upsert(
      {
        child_profile_id: childId,
        settings: newSettings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_profile_id' },
    );

    if (error) {
      this.logger.error(`updateContentFilters error: ${error.message}`);
    }

    return newSettings;
  }

  /**
   * Get media engagement (watched, liked, bookmarked videos).
   */
  async getMediaEngagement(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const [viewsRes, likesRes, bookmarksRes] = await Promise.all([
      admin.from('kids_feed_views').select('content_id, created_at').eq('child_profile_id', childId).order('created_at', { ascending: false }).limit(30),
      admin.from('kids_likes').select('content_id').eq('child_profile_id', childId).order('created_at', { ascending: false }).limit(20),
      admin.from('kids_bookmarks').select('content_id').eq('child_profile_id', childId).order('created_at', { ascending: false }).limit(20)
    ]);

    const viewIds = Array.from(new Set((viewsRes.data ?? []).map(v => v.content_id)));
    const likeIds = Array.from(new Set((likesRes.data ?? []).map(l => l.content_id)));
    const bookmarkIds = Array.from(new Set((bookmarksRes.data ?? []).map(b => b.content_id)));

    const allIds = Array.from(new Set([...viewIds, ...likeIds, ...bookmarkIds]));

    let contentMap = new Map();
    if (allIds.length > 0) {
      const { data: content } = await admin
        .from('kids_content')
        .select('*')
        .in('id', allIds);
      
      (content ?? []).forEach(c => contentMap.set(c.id, c));
    }

    return {
      watched: viewIds.map(id => contentMap.get(id)).filter(Boolean),
      liked: likeIds.map(id => contentMap.get(id)).filter(Boolean),
      bookmarked: bookmarkIds.map(id => contentMap.get(id)).filter(Boolean),
    };
  }
}
