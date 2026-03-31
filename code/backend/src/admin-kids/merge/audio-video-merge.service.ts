import { Injectable, Logger } from '@nestjs/common';
import { BunnyCdnService } from '../../bunnycdn/bunnycdn.service';
import { spawn } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpeg: typeof import('fluent-ffmpeg') = require('fluent-ffmpeg');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpegStaticPath: string = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStaticPath);

// Removed BUCKET constant

/**
 * Muxes TTS onto a base animation: output length = min(audio, video).
 * - Shorter narration → video is trimmed to that length (no extra tail on the animation).
 * - Longer narration than base → audio is trimmed to video length (warn); avoid via 45s script cap.
 */
@Injectable()
export class AudioVideoMergeService {
  private readonly logger = new Logger(AudioVideoMergeService.name);

  constructor(private readonly bunnyCdnService: BunnyCdnService) {}

  /**
   * Muxes narration onto generated video. `narrationUrl` may be a pure audio file or a **video
   * container (e.g. MP4)**; in the latter case we extract the audio track to a temp file first.
   */
  async mergeToStorage(videoUrl: string, narrationUrl: string, storageKeyPrefix: string): Promise<string> {
    const tmpDir = os.tmpdir();
    const id = randomUUID();
    const outFile = path.join(tmpDir, `kids-merged-${id}.mp4`);

    let narrationAudioPath: string | null = null;
    try {
      narrationAudioPath = await this.prepareNarrationAudioPath(narrationUrl);

      this.logger.log(`Merging video+audio → ${outFile.slice(-40)}`);

      await this.runFfmpegWithAlignedDuration(videoUrl, narrationAudioPath, outFile);
      const buffer = fs.readFileSync(outFile);
      return await this.bunnyCdnService.uploadBuffer(buffer, `${storageKeyPrefix}/${id}.mp4`);
    } finally {
      if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
      if (narrationAudioPath && fs.existsSync(narrationAudioPath)) {
        try {
          fs.unlinkSync(narrationAudioPath);
        } catch {
          /* noop */
        }
      }
    }
  }

  /**
   * If the URL is an MP4 (or other video container), extract audio to a temp `.m4a`.
   * Otherwise use the URL directly (e.g. `.mp3`, `.m4a`, `.aac`).
   */
  private async prepareNarrationAudioPath(narrationUrl: string): Promise<string> {
    if (!this.shouldExtractAudioFromContainer(narrationUrl)) {
      return narrationUrl;
    }

    const tmpDir = os.tmpdir();
    const outPath = path.join(tmpDir, `kids-narr-extract-${randomUUID()}.m4a`);
    this.logger.log('Extracting audio from narration container (e.g. MP4) for merge');

    await new Promise<void>((resolve, reject) => {
      ffmpeg()
        .input(narrationUrl)
        .outputOptions(['-vn', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart'])
        .output(outPath)
        .on('end', () => resolve())
        .on('error', (err: Error) =>
          reject(new Error(`Failed to extract audio from narration: ${err.message}`)),
        )
        .run();
    });

    return outPath;
  }

  /**
   * Supabase signed URLs often omit `.mp4` in the path — set `KIDS_CUSTOM_MASCOT_NARRATION_IS_VIDEO_CONTAINER=true`
   * to always run the extract step (audio-only temp file) before merge.
   */
  private shouldExtractAudioFromContainer(url: string): boolean {
    if (process.env.KIDS_CUSTOM_MASCOT_NARRATION_IS_VIDEO_CONTAINER === 'true') {
      return true;
    }
    const pathPart = url.split('?')[0].toLowerCase();
    return (
      pathPart.endsWith('.mp4') ||
      pathPart.endsWith('.mov') ||
      pathPart.endsWith('.webm') ||
      pathPart.endsWith('.mkv')
    );
  }

  /** Uses bundled ffmpeg -i (ffmpeg-static has no ffprobe). */
  private probeDurationSeconds(url: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const proc = spawn(ffmpegStaticPath, ['-hide_banner', '-nostats', '-i', url, '-f', 'null', '-']);
      let err = '';
      proc.stderr?.on('data', (c: Buffer) => {
        err += c.toString();
      });
      proc.on('error', (e) => reject(e));
      proc.on('close', () => {
        const m = err.match(/Duration:\s*(\d+):(\d+):(\d+\.?\d*)/);
        if (!m) {
          reject(
            new Error(`Could not parse duration from ffmpeg for URL (first 80 chars): ${url.slice(0, 80)}`),
          );
          return;
        }
        const h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        const sec = parseFloat(m[3]);
        const d = h * 3600 + min * 60 + sec;
        resolve(Number.isFinite(d) && d > 0 ? d : 0);
      });
    });
  }

  private async runFfmpegWithAlignedDuration(
    videoUrl: string,
    audioUrl: string,
    outputPath: string,
  ): Promise<void> {
    const [videoDur, audioDur] = await Promise.all([
      this.probeDurationSeconds(videoUrl),
      this.probeDurationSeconds(audioUrl),
    ]);

    if (videoDur <= 0 || audioDur <= 0) {
      throw new Error(
        `Invalid probed durations (video=${videoDur}s, audio=${audioDur}s). Check URLs are reachable.`,
      );
    }

    const outSeconds = Math.min(videoDur, audioDur);
    const end = outSeconds.toFixed(4);

    if (audioDur > videoDur + 0.05) {
      this.logger.warn(
        `TTS (${audioDur.toFixed(2)}s) is longer than base video (${videoDur.toFixed(2)}s); output trimmed to video length`,
      );
    } else {
      this.logger.log(
        `Trimming base video to narration length: output ${outSeconds.toFixed(2)}s (audio ${audioDur.toFixed(2)}s, base ${videoDur.toFixed(2)}s)`,
      );
    }

    const filter = `[0:v]trim=start=0:end=${end},setpts=PTS-STARTPTS[v];[1:a]atrim=start=0:end=${end},asetpts=PTS-STARTPTS[a]`;

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoUrl)
        .input(audioUrl)
        .complexFilter(filter)
        .outputOptions([
          '-map',
          '[v]',
          '-map',
          '[a]',
          '-c:v',
          'libx264',
          '-crf',
          '23',
          '-preset',
          'veryfast',
          '-movflags',
          '+faststart',
          '-c:a',
          'aac',
          '-b:a',
          '192k',
        ])
        .output(outputPath)
        .on('end', () => resolve())
        .on('error', (err: Error) =>
          reject(new Error(`ffmpeg merge failed: ${err.message}`)),
        )
        .run();
    });
  }

  // Helper upload function removed as we now use BunnyCdnService directly
}
