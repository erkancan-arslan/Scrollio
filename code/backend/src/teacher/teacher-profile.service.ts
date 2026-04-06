import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { BunnyCdnService } from '../bunnycdn/bunnycdn.service';
import { UpdateTeacherProfileDto } from './dto';

@Injectable()
export class TeacherProfileService {
  private readonly logger = new Logger(TeacherProfileService.name);

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly bunnyCdnService: BunnyCdnService,
  ) {}

  async getProfile(teacherId: string) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('teacher_profiles')
      .select('*')
      .eq('id', teacherId)
      .single();

    if (error || !data) throw new NotFoundException('Teacher profile not found');
    return data;
  }

  async updateProfile(teacherId: string, dto: UpdateTeacherProfileDto) {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin
      .from('teacher_profiles')
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq('id', teacherId)
      .select()
      .single();

    if (error) {
      this.logger.error(`Update teacher profile error: ${error.message}`);
      throw error;
    }
    return data;
  }

  async uploadReferenceVideo(
    teacherId: string,
    file: Buffer,
    filename: string,
    contentType: string,
  ) {
    const admin = this.supabaseService.getAdminClient();
    const storagePath = `teachers/${teacherId}/${Date.now()}-${filename}`;

    let publicUrl: string;
    try {
      publicUrl = await this.bunnyCdnService.uploadBuffer(
        file,
        storagePath,
        contentType,
      );
    } catch (uploadError) {
      this.logger.error('Reference video upload failed', uploadError);
      throw uploadError;
    }

    const { data, error } = await admin
      .from('teacher_profiles')
      .update({
        reference_video_url: publicUrl,
        reference_video_storage_path: storagePath,
        reference_video_status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', teacherId)
      .select()
      .single();

    if (error) {
      this.logger.error('Update profile with video URL failed', error);
      throw error;
    }

    return data;
  }
}
