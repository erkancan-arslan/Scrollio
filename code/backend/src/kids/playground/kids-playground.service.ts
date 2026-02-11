import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { UploadDrawingDto } from './dto';

@Injectable()
export class KidsPlaygroundService {
  private readonly logger = new Logger(KidsPlaygroundService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Upload a drawing. Stores the base64 data and optional metadata.
   */
  async uploadDrawing(childId: string, dto: UploadDrawingDto) {
    const admin = this.supabaseService.getAdminClient();

    const { data: drawing, error } = await admin
      .from('kids_drawings')
      .insert({
        child_profile_id: childId,
        title: dto.title ?? 'Untitled Drawing',
        image_data: dto.drawingData,
        content_id: dto.contentId ?? null,
      })
      .select()
      .single();

    if (error) {
      this.logger.error(`uploadDrawing error: ${error.message}`);
      throw new NotFoundException('Failed to save drawing');
    }

    // Award XP for drawing
    await this.addXp(admin, childId, 15);

    // Log activity
    await admin.from('kids_activity_logs').insert({
      child_profile_id: childId,
      event_type: 'drawing_uploaded',
      metadata: { drawing_id: drawing.id, title: dto.title },
    });

    return { id: drawing.id, title: drawing.title, xpEarned: 15 };
  }

  /**
   * Get all drawings for a child.
   */
  async getDrawings(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_drawings')
      .select('id, title, image_data, created_at')
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      this.logger.error(`getDrawings error: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Get a specific character for the child.
   */
  async getCharacter(childId: string, characterId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_characters')
      .select('*')
      .eq('id', characterId)
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (error || !data) {
      throw new NotFoundException('Character not found');
    }

    return data;
  }

  /**
   * Get all characters for a child.
   */
  async getCharacters(childId: string) {
    const admin = this.supabaseService.getAdminClient();

    const { data, error } = await admin
      .from('kids_characters')
      .select('*')
      .eq('child_profile_id', childId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`getCharacters error: ${error.message}`);
    }

    return data ?? [];
  }

  /**
   * Placeholder for animation data — returns character with animation metadata.
   */
  async getAnimation(_childId: string, animationId: string) {
    // Animations are stored as metadata on characters for now
    const admin = this.supabaseService.getAdminClient();

    const { data } = await admin
      .from('kids_characters')
      .select('*')
      .eq('id', animationId)
      .maybeSingle();

    if (!data) {
      throw new NotFoundException('Animation not found');
    }

    return data;
  }

  private async addXp(
    admin: ReturnType<SupabaseService['getAdminClient']>,
    childId: string,
    xpAmount: number,
  ) {
    const { data: progress } = await admin
      .from('kids_progress')
      .select('*')
      .eq('child_profile_id', childId)
      .maybeSingle();

    if (!progress) return;

    let newXp = (progress.xp as number) + xpAmount;
    let level = progress.level as number;

    while (newXp >= level * 100) {
      newXp -= level * 100;
      level++;
    }

    await admin
      .from('kids_progress')
      .update({ xp: newXp, level, updated_at: new Date().toISOString() })
      .eq('child_profile_id', childId);
  }
}
