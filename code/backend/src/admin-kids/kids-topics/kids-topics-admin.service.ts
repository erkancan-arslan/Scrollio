import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import { CreateAdminKidsTopicDto } from './dto/create-admin-kids-topic.dto';

@Injectable()
export class KidsTopicsAdminService {
  private readonly logger = new Logger(KidsTopicsAdminService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('kids_topics')
      .select('id, name, icon_url, category, is_active, created_at')
      .order('name', { ascending: true });

    if (error) {
      this.logger.error('Failed to list kids_topics', error);
      throw error;
    }
    return data ?? [];
  }

  async create(dto: CreateAdminKidsTopicDto) {
    const admin = this.supabaseService.getAdminClient();
    const trimmed = dto.name.trim();
    const { data, error } = await admin
      .from('kids_topics')
      .insert({
        name: trimmed,
        category: dto.category?.trim() || null,
        icon_url: dto.iconUrl?.trim() || null,
        is_active: true,
      })
      .select('id, name, icon_url, category, is_active, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new ConflictException(`A topic named "${trimmed}" already exists`);
      }
      this.logger.error('Failed to create kids_topic', error);
      throw error;
    }
    return data;
  }
}
