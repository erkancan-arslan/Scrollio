import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BunnyCdnService } from '../../bunnycdn/bunnycdn.service';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpeg: typeof import('fluent-ffmpeg') = require('fluent-ffmpeg');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ffmpegStaticPath: string = require('ffmpeg-static');

ffmpeg.setFfmpegPath(ffmpegStaticPath);

interface WhisperChunk {
  text: string;
  timestamp: [number, number];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Transcribes TTS audio via FAL Whisper, generates styled ASS subtitles,
 * and burns them into the video using FFmpeg.
 */
@Injectable()
export class SubtitleService {
  private readonly logger = new Logger(SubtitleService.name);
  private readonly falKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly bunnyCdnService: BunnyCdnService,
  ) {
    this.falKey = this.configService.get<string>('FAL_KEY') || '';
  }

  /**
   * Full flow: transcribe audio → generate ASS → burn into video → upload to Bunny.
   * Returns the CDN URL of the subtitled video.
   */
  async burnIntoVideo(
    videoUrl: string,
    _narrationText: string,
    audioUrl: string,
    jobId: string,
  ): Promise<string> {
    this.logger.log(`[subtitle] Starting subtitle burn for job ${jobId}`);

    const chunks = await this.transcribe(audioUrl);
    if (chunks.length === 0) {
      this.logger.warn(`[subtitle] Whisper returned no chunks for job ${jobId}; skipping subtitle burn`);
      return videoUrl;
    }

    const assContent = this.generateAss(chunks);
    const id = randomUUID();
    const tmpDir = os.tmpdir();
    const assFile = path.join(tmpDir, `subs-${id}.ass`);
    const outFile = path.join(tmpDir, `subtitled-${id}.mp4`);

    try {
      fs.writeFileSync(assFile, assContent, 'utf-8');
      await this.runFfmpegBurn(videoUrl, assFile, outFile);

      const buffer = fs.readFileSync(outFile);
      const cdnUrl = await this.bunnyCdnService.uploadBuffer(
        buffer,
        `subtitled-videos/${jobId}/subtitled.mp4`,
      );
      this.logger.log(`[subtitle] Subtitled video uploaded: ${cdnUrl}`);
      return cdnUrl;
    } finally {
      for (const f of [assFile, outFile]) {
        if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch { /* noop */ }
      }
    }
  }

  /**
   * Calls FAL Whisper to get timestamped segments from TTS audio.
   */
  private async transcribe(audioUrl: string): Promise<WhisperChunk[]> {
    this.logger.log(`[subtitle] Transcribing audio via Whisper`);

    const maxAttempts = 3;
    let lastErr = '';

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await fetch('https://fal.run/fal-ai/whisper', {
          method: 'POST',
          headers: {
            Authorization: `Key ${this.falKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audio_url: audioUrl,
            task: 'transcribe',
            chunk_level: 'segment',
            version: '3',
          }),
        });

        if (!response.ok) {
          const body = await response.text();
          const retryable = response.status === 429 || response.status >= 500;
          if (retryable && attempt < maxAttempts - 1) {
            lastErr = `${response.status}: ${body}`;
            await sleep(Math.min(1000 * 2 ** attempt, 8000));
            continue;
          }
          throw new Error(`Whisper transcription failed (${response.status}): ${body}`);
        }

        const result = await response.json();
        const chunks: WhisperChunk[] = (result.chunks || []).map((c: any) => ({
          text: c.text?.trim() || '',
          timestamp: [
            typeof c.timestamp?.[0] === 'number' ? c.timestamp[0] : 0,
            typeof c.timestamp?.[1] === 'number' ? c.timestamp[1] : 0,
          ] as [number, number],
        })).filter((c: WhisperChunk) => c.text.length > 0 && c.timestamp[1] > c.timestamp[0]);

        this.logger.log(`[subtitle] Whisper returned ${chunks.length} segments`);
        return chunks;
      } catch (err) {
        lastErr = err instanceof Error ? err.message : String(err);
        if (attempt < maxAttempts - 1) {
          await sleep(Math.min(1000 * 2 ** attempt, 8000));
          continue;
        }
      }
    }

    this.logger.error(`[subtitle] Whisper failed after ${maxAttempts} attempts: ${lastErr}`);
    return [];
  }

  /**
   * Generates ASS subtitle content optimized for 1080x1920 vertical mobile video.
   */
  private generateAss(chunks: WhisperChunk[]): string {
    const header = [
      '[Script Info]',
      'ScriptType: v4.00+',
      'PlayResX: 1080',
      'PlayResY: 1920',
      'WrapStyle: 0',
      '',
      '[V4+ Styles]',
      'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
      // White text, black outline (3px), semi-transparent black shadow, bottom-center, bold
      'Style: Default,Arial,52,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,3,1,2,40,40,120,1',
      '',
      '[Events]',
      'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text',
    ];

    const events = chunks.map((chunk) => {
      const start = this.formatAssTime(chunk.timestamp[0]);
      const end = this.formatAssTime(chunk.timestamp[1]);
      const text = chunk.text.replace(/\n/g, '\\N');
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${text}`;
    });

    return [...header, ...events, ''].join('\n');
  }

  private formatAssTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    const sWhole = Math.floor(s);
    const cs = Math.round((s - sWhole) * 100);
    return `${h}:${String(m).padStart(2, '0')}:${String(sWhole).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }

  private runFfmpegBurn(videoUrl: string, assPath: string, outputPath: string): Promise<void> {
    // FFmpeg ass filter requires escaping colons and backslashes in the path on Windows
    const escapedAssPath = assPath
      .replace(/\\/g, '/')
      .replace(/:/g, '\\:');

    return new Promise((resolve, reject) => {
      ffmpeg()
        .input(videoUrl)
        .videoFilters(`ass='${escapedAssPath}'`)
        .outputOptions([
          '-c:v', 'libx264',
          '-crf', '23',
          '-preset', 'fast',
          '-c:a', 'copy',
          '-movflags', '+faststart',
        ])
        .output(outputPath)
        .on('end', () => {
          this.logger.log(`[subtitle] FFmpeg burn completed: ${outputPath.slice(-40)}`);
          resolve();
        })
        .on('error', (err: Error) => {
          reject(new Error(`FFmpeg subtitle burn failed: ${err.message}`));
        })
        .run();
    });
  }
}
