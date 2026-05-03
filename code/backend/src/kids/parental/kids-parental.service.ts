import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { SetScreenTimeDto, UpdateContentFiltersDto } from './dto';

@Injectable()
export class KidsParentalService {
  private readonly logger = new Logger(KidsParentalService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private assertChildId(childId: string | undefined): asserts childId is string {
    if (!childId || childId === 'undefined') {
      throw new BadRequestException('X-Child-Profile-Id header is required');
    }
  }

  /**
   * Get recent activity log entries for a child.
   */
  async getActivity(childId: string, page = 1, limit = 50) {
    this.assertChildId(childId);
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
    this.assertChildId(childId);
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
    this.assertChildId(childId);
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
    this.assertChildId(childId);
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
    this.assertChildId(childId);
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
   * Get daily, weekly, and monthly watch time totals for a child.
   */
  async getWatchTimeSummary(childId: string) {
    this.assertChildId(childId);
    const admin = this.supabaseService.getAdminClient();

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now);
    monthStart.setDate(now.getDate() - 29);
    monthStart.setHours(0, 0, 0, 0);

    const { data: views } = await admin
      .from('kids_feed_views')
      .select('watched_seconds, created_at')
      .eq('child_profile_id', childId)
      .gte('created_at', monthStart.toISOString());

    const rows = views ?? [];
    const todayIso = todayStart.toISOString();
    const weekIso = weekStart.toISOString();

    let dailySeconds = 0;
    let weeklySeconds = 0;
    let monthlySeconds = 0;

    for (const row of rows) {
      const secs = row.watched_seconds ?? 0;
      monthlySeconds += secs;
      if (row.created_at >= weekIso) weeklySeconds += secs;
      if (row.created_at >= todayIso) dailySeconds += secs;
    }

    return {
      dailyMinutes: Math.round(dailySeconds / 60),
      weeklyMinutes: Math.round(weeklySeconds / 60),
      monthlyMinutes: Math.round(monthlySeconds / 60),
    };
  }

  /**
   * Get quiz performance percentage grouped by topic.
   */
  async getQuizPerformance(childId: string) {
    this.assertChildId(childId);
    const admin = this.supabaseService.getAdminClient();

    const { data: attempts } = await admin
      .from('kids_quiz_attempts')
      .select('score, quiz_id')
      .eq('child_profile_id', childId)
      .not('completed_at', 'is', null);

    if (!attempts || attempts.length === 0) return [];

    const quizIds = [...new Set(attempts.map((a) => a.quiz_id as string))];

    const { data: quizzes } = await admin
      .from('kids_quizzes')
      .select('id, content_id, questions')
      .in('id', quizIds);

    if (!quizzes || quizzes.length === 0) return [];

    const contentIds = [...new Set(quizzes.map((q) => q.content_id as string))];

    const { data: contents } = await admin
      .from('kids_content')
      .select('id, topic, topic_tags')
      .in('id', contentIds);

    const contentMap = new Map<string, { topic: string }>();
    for (const c of contents ?? []) {
      const topic = (c.topic as string) || ((c.topic_tags as string[])?.[0]) || 'General';
      contentMap.set(c.id as string, { topic });
    }

    // Each attempt row stores score as 0 or 100 (per-question binary score).
    const quizMap = new Map<string, { contentId: string }>();
    for (const q of quizzes) {
      quizMap.set(q.id as string, { contentId: q.content_id as string });
    }

    const topicStats = new Map<string, { totalPct: number; count: number }>();
    for (const attempt of attempts) {
      const quiz = quizMap.get(attempt.quiz_id as string);
      if (!quiz) continue;
      const content = contentMap.get(quiz.contentId);
      const topic = content?.topic ?? 'General';
      const pct = attempt.score as number;
      const existing = topicStats.get(topic) ?? { totalPct: 0, count: 0 };
      topicStats.set(topic, { totalPct: existing.totalPct + pct, count: existing.count + 1 });
    }

    return Array.from(topicStats.entries())
      .map(([topic, { totalPct, count }]) => ({
        topic,
        attempts: count,
        avgScorePct: Math.round(totalPct / count),
      }))
      .sort((a, b) => b.avgScorePct - a.avgScorePct);
  }

  /**
   * Full weekly report for the dashboard — covers this calendar week (Mon–Sun).
   */
  async getWeeklyReportForDashboard(childId: string) {
    this.assertChildId(childId);
    const admin = this.supabaseService.getAdminClient();

    const now = new Date();

    // Week starts on Monday
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, …
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartIso = weekStart.toISOString();
    const weekEndIso = weekEnd.toISOString();

    // Watch time + videos watched this week
    const { data: views } = await admin
      .from('kids_feed_views')
      .select('watched_seconds, content_id')
      .eq('child_profile_id', childId)
      .gte('created_at', weekStartIso)
      .lte('created_at', weekEndIso);

    const weeklySeconds = (views ?? []).reduce(
      (sum, v) => sum + ((v.watched_seconds as number) ?? 0),
      0,
    );
    const uniqueVideos = new Set((views ?? []).map((v) => v.content_id as string)).size;

    // Activity breakdown this week
    const { data: activityRows } = await admin
      .from('kids_activity_logs')
      .select('event_type')
      .eq('child_profile_id', childId)
      .gte('created_at', weekStartIso)
      .lte('created_at', weekEndIso);

    const activityBreakdown: Record<string, number> = {};
    for (const row of activityRows ?? []) {
      const t = row.event_type as string;
      activityBreakdown[t] = (activityBreakdown[t] ?? 0) + 1;
    }

    // Quiz performance this week
    const { data: attempts } = await admin
      .from('kids_quiz_attempts')
      .select('score, quiz_id')
      .eq('child_profile_id', childId)
      .not('completed_at', 'is', null)
      .gte('created_at', weekStartIso)
      .lte('created_at', weekEndIso);

    const quizTopics: Array<{ topic: string; attempts: number; avgScorePct: number }> = [];

    if (attempts && attempts.length > 0) {
      const quizIds = [...new Set(attempts.map((a) => a.quiz_id as string))];
      const { data: quizzes } = await admin
        .from('kids_quizzes')
        .select('id, content_id')
        .in('id', quizIds);

      const contentIds = [...new Set((quizzes ?? []).map((q) => q.content_id as string))];
      const { data: contents } = await admin
        .from('kids_content')
        .select('id, topic, topic_tags')
        .in('id', contentIds);

      const contentMap = new Map<string, string>();
      for (const c of contents ?? []) {
        const topic = (c.topic as string) || ((c.topic_tags as string[])?.[0]) || 'General';
        contentMap.set(c.id as string, topic);
      }

      const quizContentMap = new Map<string, string>();
      for (const q of quizzes ?? []) {
        quizContentMap.set(q.id as string, contentMap.get(q.content_id as string) ?? 'General');
      }

      const topicStats = new Map<string, { total: number; count: number }>();
      for (const a of attempts) {
        const topic = quizContentMap.get(a.quiz_id as string) ?? 'General';
        const existing = topicStats.get(topic) ?? { total: 0, count: 0 };
        topicStats.set(topic, { total: existing.total + (a.score as number), count: existing.count + 1 });
      }

      for (const [topic, { total, count }] of topicStats.entries()) {
        quizTopics.push({ topic, attempts: count, avgScorePct: Math.round(total / count) });
      }
      quizTopics.sort((a, b) => b.avgScorePct - a.avgScorePct);
    }

    const fmt = (d: Date) =>
      d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return {
      weekLabel: `${fmt(weekStart)} – ${fmt(weekEnd)}`,
      watchMinutes: Math.round(weeklySeconds / 60),
      videosWatched: uniqueVideos,
      quizzesAttempted: (activityBreakdown['quiz_attempt'] ?? 0),
      activityBreakdown,
      quizTopics,
    };
  }

  /**
   * Build weekly summary report data for a child (used by cron job).
   */
  async buildWeeklyReportData(childId: string) {
    const [watchTime, quizPerf] = await Promise.all([
      this.getWatchTimeSummary(childId),
      this.getQuizPerformance(childId),
    ]);

    return {
      weeklyMinutes: watchTime.weeklyMinutes,
      quizTopics: quizPerf.slice(0, 5),
    };
  }

  /**
   * Get all active child profile IDs mapped to their parent user IDs.
   */
  async getAllActiveChildParentPairs(): Promise<Array<{ childId: string; parentId: string }>> {
    const admin = this.supabaseService.getAdminClient();
    const { data } = await admin
      .from('kids_child_profiles')
      .select('id, parent_id')
      .eq('is_active', true);

    return (data ?? []).map((row) => ({
      childId: row.id as string,
      parentId: row.parent_id as string,
    }));
  }

  /**
   * Get media engagement (watched, liked, bookmarked videos).
   */
  async getMediaEngagement(childId: string) {
    this.assertChildId(childId);
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
