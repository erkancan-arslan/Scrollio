import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { ToggleBookmarkDto } from './dto';

@Injectable()
export class KidsBookmarkService {
  private readonly logger = new Logger(KidsBookmarkService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Toggle bookmark: if exists, remove it; if not, add it.
   */
  async toggleBookmark(childId: string, dto: ToggleBookmarkDto) {
    const admin = this.supabaseService.getAdminClient();

    // Check if bookmark exists
    const { data: existing } = await admin
      .from('kids_bookmarks')
      .select('id')
      .eq('child_profile_id', childId)
      .eq('content_id', dto.contentId)
      .maybeSingle();

    if (existing) {
      // Remove bookmark
      await admin
        .from('kids_bookmarks')
        .delete()
        .eq('child_profile_id', childId)
        .eq('content_id', dto.contentId);

      await admin.from('kids_activity_logs').insert({
        child_profile_id: childId,
        event_type: 'bookmark_removed',
        metadata: { content_id: dto.contentId },
      });

      return { bookmarked: false };
    }

    // Add bookmark
    const { error } = await admin.from('kids_bookmarks').insert({
      child_profile_id: childId,
      content_id: dto.contentId,
    });

    if (error) {
      this.logger.error(`toggleBookmark insert error: ${error.message}`);
    }

    await admin.from('kids_activity_logs').insert({
      child_profile_id: childId,
      event_type: 'bookmark_added',
      metadata: { content_id: dto.contentId },
    });

    return { bookmarked: true };
  }

  /**
   * Get all bookmarked content for a child, joined with content details.
   */
  async getBookmarks(childId: string, page = 1, limit = 20) {
    const admin = this.supabaseService.getAdminClient();
    const offset = (page - 1) * limit;

    const { data, count, error } = await admin
      .from('kids_bookmarks')
      .select('*, kids_content(*)', { count: 'exact' })
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.logger.error(`getBookmarks error: ${error.message}`);
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
