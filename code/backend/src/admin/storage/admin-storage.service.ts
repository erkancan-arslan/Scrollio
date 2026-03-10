import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class AdminStorageService {
  private readonly logger = new Logger(AdminStorageService.name);
  private readonly bucket = 'reference-videos';

  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadFile(
    file: Buffer,
    filename: string,
    userId: string,
    contentType = 'video/mp4',
  ): Promise<{ storagePath: string; publicUrl: string }> {
    const admin = this.supabaseService.getAdminClient();
    const timestamp = Date.now();
    const storagePath = `${userId}/${timestamp}-${filename}`;

    const { error } = await admin.storage
      .from(this.bucket)
      .upload(storagePath, file, { contentType, upsert: false });

    if (error) {
      this.logger.error('Failed to upload reference video file', error);
      throw error;
    }

    const { data: urlData } = admin.storage
      .from(this.bucket)
      .getPublicUrl(storagePath);

    return {
      storagePath,
      publicUrl: urlData.publicUrl,
    };
  }

  async getSignedUrl(storagePath: string, expiresIn = 3600): Promise<string> {
    const admin = this.supabaseService.getAdminClient();
    const { data, error } = await admin.storage
      .from(this.bucket)
      .createSignedUrl(storagePath, expiresIn);

    if (error) {
      this.logger.error('Failed to create signed URL', error);
      throw error;
    }
    return data.signedUrl;
  }

  async deleteFile(storagePath: string): Promise<void> {
    const admin = this.supabaseService.getAdminClient();
    const { error } = await admin.storage
      .from(this.bucket)
      .remove([storagePath]);

    if (error) {
      this.logger.error('Failed to delete file from storage', error);
      throw error;
    }
  }
}
