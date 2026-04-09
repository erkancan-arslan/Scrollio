import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { ToggleLikeDto } from './dto';

@Injectable()
export class KidsLikeService {
  private readonly logger = new Logger(KidsLikeService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async toggleLike(childId: string, dto: ToggleLikeDto) {
    const admin = this.supabaseService.getAdminClient();

    const { data: existing } = await admin
      .from('kids_likes')
      .select('id')
      .eq('child_profile_id', childId)
      .eq('content_id', dto.contentId)
      .maybeSingle();

    if (existing) {
      await admin
        .from('kids_likes')
        .delete()
        .eq('child_profile_id', childId)
        .eq('content_id', dto.contentId);

      await admin.from('kids_activity_logs').insert({
        child_profile_id: childId,
        event_type: 'like_removed',
        metadata: { content_id: dto.contentId },
      });

      return { liked: false };
    }

    const { error } = await admin.from('kids_likes').insert({
      child_profile_id: childId,
      content_id: dto.contentId,
    });

    if (error) {
      this.logger.error(`toggleLike insert error: ${error.message}`);
    }

    await admin.from('kids_activity_logs').insert({
      child_profile_id: childId,
      event_type: 'like_added',
      metadata: { content_id: dto.contentId },
    });

    return { liked: true };
  }

  async getLikedContent(childId: string, page = 1, limit = 20) {
    const admin = this.supabaseService.getAdminClient();
    const offset = (page - 1) * limit;

    const { data, count, error } = await admin
      .from('kids_likes')
      .select('*, kids_content(*)', { count: 'exact' })
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`getLikedContent error: ${error.message}`);
    }

    return {
      data: data ?? [],
      meta: {
        page,
        limit,
        total: count ?? 0,
        hasMore: offset + limit < (count ?? 0),
      },
    };
  }
}
