import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// fluent-ffmpeg and ffmpeg-static are CommonJS modules; require() is required
// for correct runtime binding when esModuleInterop is not enabled.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpeg: typeof import('fluent-ffmpeg') = require('fluent-ffmpeg');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpegStaticPath: string = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStaticPath);

const BUCKET = 'generated-thumbnails';
const SEEK_SECONDS = 0.5; // grab the frame at 0.5 s into the video

@Injectable()
export class ThumbnailService {
  private readonly logger = new Logger(ThumbnailService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Extracts the first meaningful frame from the video at `videoUrl`,
   * uploads it to the `generated-thumbnails` Supabase bucket, and returns
   * the public URL.
   */
  async generate(videoUrl: string, jobId: string): Promise<string> {
    this.logger.log(`Extracting thumbnail from video for job ${jobId}`);

    const tmpFile = path.join(os.tmpdir(), `thumb-${jobId}.jpg`);

    try {
      await this.extractFrame(videoUrl, tmpFile);
      const buffer = fs.readFileSync(tmpFile);
      return await this.uploadBuffer(buffer, jobId);
    } finally {
      if (fs.existsSync(tmpFile)) {
        fs.unlinkSync(tmpFile);
      }
    }
  }

  private extractFrame(videoUrl: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoUrl)
        .inputOptions([`-ss ${SEEK_SECONDS}`])
        .outputOptions(['-vframes 1', '-q:v 2'])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`ffmpeg frame extraction failed: ${err.message}`)))
        .run();
    });
  }

  private async uploadBuffer(buffer: Buffer, jobId: string): Promise<string> {
    const storagePath = `${jobId}/thumbnail.jpg`;
    const admin = this.supabaseService.getAdminClient();

    const { error } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: 'image/jpeg', upsert: true });

    if (error) {
      this.logger.error('Failed to upload thumbnail to Supabase', error);
      throw error;
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
    this.logger.log(`Thumbnail uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  }
}
