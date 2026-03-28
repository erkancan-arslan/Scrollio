import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateTeacherProfileDto } from './dto';

@Injectable()
export class TeacherProfileService {
  private readonly logger = new Logger(TeacherProfileService.name);
  private readonly bucket = 'reference-videos';

  constructor(private readonly supabaseService: SupabaseService) {}

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

    const { error: uploadError } = await admin.storage
      .from(this.bucket)
      .upload(storagePath, file, { contentType, upsert: false });

    if (uploadError) {
      this.logger.error('Reference video upload failed', uploadError);
      throw uploadError;
    }

    const { data: urlData } = admin.storage
      .from(this.bucket)
      .getPublicUrl(storagePath);

    const { data, error } = await admin
      .from('teacher_profiles')
      .update({
        reference_video_url: urlData.publicUrl,
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
