import { Injectable, Logger } from '@nestjs/common';
import { BunnyCdnService } from '../../bunnycdn/bunnycdn.service';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';

// fluent-ffmpeg and ffmpeg-static are CommonJS modules; require() is required
// for correct runtime binding when esModuleInterop is not enabled.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpeg: typeof import('fluent-ffmpeg') = require('fluent-ffmpeg');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpegStaticPath: string = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStaticPath);

const FFMPEG_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class VideoCompositionService {
  private readonly logger = new Logger(VideoCompositionService.name);

  constructor(private readonly bunnyCdnService: BunnyCdnService) {}

  /**
   * Composes a split-screen vertical (1080×1920) video:
   *  - Top half (1080×960): lipsync educational video
   *  - Bottom half (1080×960): brainrot gameplay video (looped, muted)
   *  - Audio from lipsync video only
   *
   * Uploads the result to BunnyCDN.
   * Returns the public URL.
   */
  async compose(
    lipsyncVideoUrl: string,
    brainrotVideoUrl: string,
    jobId: string,
  ): Promise<string> {
    this.logger.log(`Composing split-screen video for job ${jobId}`);

    const tmpLipsync = path.join(os.tmpdir(), `lipsync-${jobId}.mp4`);
    const tmpBrainrot = path.join(os.tmpdir(), `brainrot-${jobId}.mp4`);
    const tmpOutput = path.join(os.tmpdir(), `composed-${jobId}.mp4`);

    try {
      this.logger.log(`[${jobId}] Downloading lipsync video…`);
      await this.downloadFile(lipsyncVideoUrl, tmpLipsync);
      this.logger.log(`[${jobId}] Downloading brainrot video…`);
      await this.downloadFile(brainrotVideoUrl, tmpBrainrot);
      this.logger.log(`[${jobId}] Both videos downloaded, running ffmpeg…`);

      await this.runComposition(tmpLipsync, tmpBrainrot, tmpOutput, jobId);

      const buffer = fs.readFileSync(tmpOutput);
      return await this.bunnyCdnService.uploadBuffer(buffer, `composed-videos/${jobId}/composed.mp4`);
    } finally {
      for (const f of [tmpLipsync, tmpBrainrot, tmpOutput]) {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      }
    }
  }

  private downloadFile(url: string, dest: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(dest);
      const protocol = url.startsWith('https') ? https : http;

      const request = protocol.get(url, (response) => {
        if (response.statusCode && response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
          file.close();
          return this.downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200) {
          file.close();
          return reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => file.close(() => resolve()));
        file.on('error', reject);
      });

      request.on('error', (err) => {
        file.close();
        reject(err);
      });

      request.setTimeout(60_000, () => {
        request.destroy();
        file.close();
        reject(new Error(`Download timed out for ${url}`));
      });
    });
  }

  private runComposition(
    lipsyncPath: string,
    brainrotPath: string,
    outputPath: string,
    jobId: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let timeoutHandle: NodeJS.Timeout | null = null;
      let proc: ReturnType<typeof ffmpeg> | null = null;

      const cleanup = (err?: Error) => {
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (err) reject(err);
        else resolve();
      };

      proc = ffmpeg()
        .input(lipsyncPath)
        .input(brainrotPath)
        .inputOptions(['-stream_loop -1']) // loop brainrot infinitely
        .complexFilter([
          '[0:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[top]',
          '[1:v]scale=1080:960:force_original_aspect_ratio=increase,crop=1080:960[bottom]',
          '[top][bottom]vstack=inputs=2[outv]',
        ])
        .outputOptions([
          '-map [outv]',
          '-map 0:a',
          '-r 30',               // cap output to 30fps to prevent frame duplication explosion
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-c:a aac',
          '-b:a 128k',
          '-movflags +faststart',
          '-shortest',
        ])
        .output(outputPath)
        .on('start', (cmd) => this.logger.debug(`[${jobId}] FFmpeg command: ${cmd}`))
        .on('progress', (p) => this.logger.debug(`[${jobId}] FFmpeg progress: ${JSON.stringify(p)}`))
        .on('stderr', (line) => this.logger.verbose(`[${jobId}] ffmpeg: ${line}`))
        .on('end', () => {
          this.logger.log(`[${jobId}] Composition completed: ${outputPath}`);
          cleanup();
        })
        .on('error', (err) => {
          cleanup(new Error(`FFmpeg composition failed: ${err.message}`));
        });

      timeoutHandle = setTimeout(() => {
        this.logger.error(`[${jobId}] FFmpeg timed out after ${FFMPEG_TIMEOUT_MS / 1000}s, killing process`);
        try { (proc as any).kill('SIGKILL'); } catch {}
        cleanup(new Error(`FFmpeg composition timed out after ${FFMPEG_TIMEOUT_MS / 1000}s`));
      }, FFMPEG_TIMEOUT_MS);

      proc.run();
    });
  }
}
