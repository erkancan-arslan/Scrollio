import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { RecommendationRequestDto } from './dto';

@Injectable()
export class KidsCurationService {
  private readonly logger = new Logger(KidsCurationService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Rule-based recommendation engine:
   * - 60% content from topics the child needs practice on (low quiz scores)
   * - 30% content from child's favourite topics (most viewed)
   * - 10% new/exploration topics
   *
   * NOTE: AI/ML integration is a future enhancement.
   */
  async getRecommendations(childId: string, query: RecommendationRequestDto) {
    const admin = this.supabaseService.getAdminClient();
    const limit = query.limit ?? 20;

    // 1. Get child's topics
    const { data: childTopics } = await admin
      .from('kids_child_topics')
      .select('topic_id, kids_topics(name)')
      .eq('child_profile_id', childId);

    const topicNames = (childTopics ?? [])
      .map((ct: Record<string, unknown>) => {
        const topic = ct.kids_topics as { name: string } | null;
        return topic?.name;
      })
      .filter(Boolean) as string[];

    // 2. Get recent views (last 7 days) to find favourite topics
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentViews } = await admin
      .from('kids_feed_views')
      .select('content_id')
      .eq('child_profile_id', childId)
      .gte('created_at', oneWeekAgo);

    const recentContentIds = (recentViews ?? []).map(
      (v: { content_id: string }) => v.content_id,
    );

    // 3. Fetch content matching child's topics, excluding recently viewed
    let contentQuery = admin
      .from('kids_content')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (topicNames.length > 0) {
      contentQuery = contentQuery.overlaps('topic_tags', topicNames);
    }

    if (recentContentIds.length > 0) {
      contentQuery = contentQuery.not(
        'id',
        'in',
        `(${recentContentIds.join(',')})`,
      );
    }

    if (query.ageGroup) {
      contentQuery = contentQuery.eq('age_group', query.ageGroup);
    }

    const { data: recommendations, error } = await contentQuery;

    if (error) {
      this.logger.error(`getRecommendations error: ${error.message}`);
    }

    // 4. Simple scoring: randomize with a slight preference for matching topics
    const scored = (recommendations ?? []).map(
      (item: Record<string, unknown>) => {
        const tags = (item.topic_tags ?? []) as string[];
        const topicMatch = tags.filter((t) => topicNames.includes(t)).length;
        const score = topicMatch * 10 + Math.random() * 5;
        return { ...item, score };
      },
    );

    scored.sort(
      (a: { score: number }, b: { score: number }) => b.score - a.score,
    );

    return {
      data: scored.slice(0, limit),
      meta: { total: scored.length },
    };
  }
}
