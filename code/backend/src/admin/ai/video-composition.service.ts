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

const BUCKET = 'composed-videos';

@Injectable()
export class VideoCompositionService {
  private readonly logger = new Logger(VideoCompositionService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Composes a split-screen vertical (1080×1920) video:
   *  - Top half (1080×960): lipsync educational video
   *  - Bottom half (1080×960): brainrot gameplay video (looped, muted)
   *  - Audio from lipsync video only
   *
   * Uploads the result to the `composed-videos` Supabase bucket.
   * Returns the public URL.
   */
  async compose(
    lipsyncVideoUrl: string,
    brainrotVideoUrl: string,
    jobId: string,
  ): Promise<string> {
    this.logger.log(`Composing split-screen video for job ${jobId}`);

    const tmpOutput = path.join(os.tmpdir(), `composed-${jobId}.mp4`);

    try {
      await this.runComposition(lipsyncVideoUrl, brainrotVideoUrl, tmpOutput);
      const buffer = fs.readFileSync(tmpOutput);
      return await this.uploadBuffer(buffer, jobId);
    } finally {
      if (fs.existsSync(tmpOutput)) {
        fs.unlinkSync(tmpOutput);
      }
    }
  }

  private runComposition(
    lipsyncUrl: string,
    brainrotUrl: string,
    outputPath: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(lipsyncUrl)
        .input(brainrotUrl)
        .inputOptions(['-stream_loop -1']) // loop brainrot infinitely
        .complexFilter([
          // Scale lipsync (top) to COVER 1080×960, then crop to exact size (no black bars)
          '[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[top]',
          // Scale brainrot (bottom) to COVER 1080×960, then crop to exact size
          '[1:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[bottom]',
          // Stack vertically → 1080×1920 (9:16)
          '[top][bottom]vstack=inputs=2[outv]',
        ])
        .outputOptions([
          '-map [outv]',
          '-map 0:a',            // audio from lipsync only
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart', // streamable on mobile
          '-shortest',            // end when lipsync ends
        ])
        .output(outputPath)
        .on('end', () => {
          this.logger.log(`Composition completed: ${outputPath}`);
          resolve();
        })
        .on('error', (err) => {
          reject(new Error(`FFmpeg composition failed: ${err.message}`));
        })
        .run();
    });
  }

  private async uploadBuffer(buffer: Buffer, jobId: string): Promise<string> {
    const storagePath = `${jobId}/composed.mp4`;
    const admin = this.supabaseService.getAdminClient();

    const { error } = await admin.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: 'video/mp4', upsert: true });

    if (error) {
      this.logger.error('Failed to upload composed video to Supabase', error);
      throw error;
    }

    const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(storagePath);
    this.logger.log(`Composed video uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;
  }
}
