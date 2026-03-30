import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateReferenceVideoDto } from './dto/create-reference-video.dto';
import { UpdateReferenceVideoDto } from './dto/update-reference-video.dto';
import { ReferenceVideoQueryDto } from './dto/reference-video-query.dto';

@Injectable()
export class ReferenceVideosService {
  private readonly logger = new Logger(ReferenceVideosService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(dto: CreateReferenceVideoDto, userId: string) {
    const admin = this.supabaseService.getAdminClient();
    const record = {
      title: dto.title,
      description: dto.description,
      persona_name: dto.personaName,
      language: dto.language,
      audience_tag: dto.audienceTag || null,
      character_id: dto.characterId ?? null,
      storage_path: dto.storagePath,
      public_url: dto.publicUrl || null,
      duration_seconds: dto.durationSeconds || null,
      thumbnail_url: dto.thumbnailUrl || null,
      status: 'ready',
      uploaded_by: userId,
    };

    const { data, error } = await admin
      .from('reference_videos')
      .insert(record)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to create reference video', error);
      throw error;
    }
    return data;
  }

  async findAll(query: ReferenceVideoQueryDto) {
    const admin = this.supabaseService.getAdminClient();
    let q = admin
      .from('reference_videos')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (query.language) q = q.eq('language', query.language);
    if (query.audienceTag) q = q.eq('audience_tag', query.audienceTag);
    if (query.status) q = q.eq('status', query.status);
    if (query.search) q = q.ilike('title', `%${query.search}%`);
    if (query.limit) q = q.limit(query.limit);
    if (query.offset) q = q.range(query.offset, query.offset + (query.limit || 50) - 1);

    const { data, error, count } = await q;

    if (error) {
      this.logger.error('Failed to list reference videos', error);
      throw error;
    }
    return { data: data ?? [], count: count ?? 0 };
  }

  async findOne(id: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('reference_videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      throw new NotFoundException('Reference video not found');
    }
    return data;
  }

  async update(id: string, dto: UpdateReferenceVideoDto) {
    const admin = this.supabaseService.getAdminClient();

    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (dto.title !== undefined) updateFields.title = dto.title;
    if (dto.description !== undefined) updateFields.description = dto.description;
    if (dto.personaName !== undefined) updateFields.persona_name = dto.personaName;
    if (dto.language !== undefined) updateFields.language = dto.language;
    if (dto.audienceTag !== undefined) updateFields.audience_tag = dto.audienceTag;
    if (dto.characterId !== undefined) updateFields.character_id = dto.characterId;
    if (dto.publicUrl !== undefined) updateFields.public_url = dto.publicUrl;
    if (dto.thumbnailUrl !== undefined) updateFields.thumbnail_url = dto.thumbnailUrl;
    if (dto.status !== undefined) updateFields.status = dto.status;

    const { data, error } = await admin
      .from('reference_videos')
      .update(updateFields)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      this.logger.error('Failed to update reference video', error);
      throw error;
    }
    return data;
  }

  async remove(id: string) {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin
      .from('reference_videos')
      .delete()
      .eq('id', id);

    if (error) {
      this.logger.error('Failed to delete reference video', error);
      throw error;
    }
    return { deleted: true };
  }
}
