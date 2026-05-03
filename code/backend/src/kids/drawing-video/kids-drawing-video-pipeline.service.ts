import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fal } from '@fal-ai/client';
import { KidsDrawingVideoJobsService } from './kids-drawing-video-jobs.service';
import { getDrawingVideoFalEndpoints } from './kids-drawing-video-fal-endpoints';
import {
  buildImageToVideoInput,
  buildStylizeInput,
} from './kids-drawing-video-pipeline-inputs';
import {
  extractFirstImageUrl,
  extractVideoUrl,
} from '../custom-mascot/kids-custom-mascot-fal-response';
import { resolveEnvString } from '../custom-mascot/kids-custom-mascot-env.util';

const PINNED_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Pipeline (current_step keys are surfaced to mobile for progress copy):
 *   stylize → image_to_video → done
 */
@Injectable()
export class KidsDrawingVideoPipelineService {
  private readonly logger = new Logger(KidsDrawingVideoPipelineService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jobsService: KidsDrawingVideoJobsService,
  ) {}

  async run(jobId: string, childProfileId: string, sourceImageUrl: string): Promise<void> {
    const falKey = resolveEnvString(this.config.get<string>('FAL_KEY'), 'FAL_KEY');
    if (!falKey) {
      await this.fail(jobId, 'FAL_KEY is not configured');
      return;
    }

    fal.config({ credentials: falKey });
    const endpoints = getDrawingVideoFalEndpoints(this.config);

    try {
      await this.jobsService.updateJob(jobId, {
        status: 'processing',
        currentStep: 'stylize',
        progressPercent: 8,
        errorMessage: null,
      });

      // Step 1 — drawing → 3D Pixar character image (also gives us a public URL).
      // If the source is already an https:// URL we still rerun nano-banana so the
      // input to the video step is consistent in style and resolution.
      const stylizedUrl = await this.falImageStep(
        endpoints.stylize,
        buildStylizeInput(sourceImageUrl),
        'stylize',
      );
      await this.jobsService.updateJob(jobId, {
        stylizedImageUrl: stylizedUrl,
        currentStep: 'image_to_video',
        progressPercent: 50,
      });

      // Step 2 — character image → animated talking video.
      const videoUrl = await this.falVideoStep(
        endpoints.imageToVideo,
        buildImageToVideoInput(stylizedUrl),
      );

      const pinnedUntil = new Date(Date.now() + PINNED_DURATION_MS).toISOString();
      await this.jobsService.updateJob(jobId, {
        videoUrl,
        pinnedUntil,
        status: 'ready',
        currentStep: 'done',
        progressPercent: 100,
      });
      await this.jobsService.resetCycle(childProfileId, jobId);
      this.logger.log(`Drawing video job ${jobId} ready (pinned until ${pinnedUntil})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Drawing video job ${jobId} failed: ${msg}`);
      await this.fail(jobId, msg);
      // Even on failure, push the cycle forward so we don't hammer FAL on the next tick.
      await this.jobsService.resetCycle(childProfileId, jobId);
    }
  }

  private async fail(jobId: string, message: string): Promise<void> {
    await this.jobsService.updateJob(jobId, {
      status: 'failed',
      currentStep: null,
      errorMessage: message,
    });
  }

  private async falImageStep(
    endpoint: string,
    input: Record<string, unknown>,
    stepLabel: string,
  ): Promise<string> {
    this.logger.log(`Fal ${stepLabel} → ${endpoint}`);
    const result = await fal.subscribe(endpoint, { input });
    const url = extractFirstImageUrl(result.data);
    if (!url) {
      this.logger.error(`Fal ${stepLabel} raw data: ${JSON.stringify(result.data)?.slice(0, 500)}`);
      throw new Error(`${stepLabel}: Fal returned no image URL`);
    }
    return url;
  }

  private async falVideoStep(endpoint: string, input: Record<string, unknown>): Promise<string> {
    this.logger.log(`Fal image_to_video → ${endpoint}`);
    const result = await fal.subscribe(endpoint, {
      input,
      timeout: 10 * 60 * 1000, // 10 minute hard cap
      onQueueUpdate: (update) => {
        if (update.status === 'IN_QUEUE') {
          this.logger.log(
            `Fal i2v queued — position ${(update as { queue_position?: number }).queue_position ?? '?'}`,
          );
        } else if (update.status === 'IN_PROGRESS') {
          this.logger.log('Fal i2v in progress…');
        }
      },
    });
    const videoUrl = extractVideoUrl(result.data);
    if (!videoUrl) {
      this.logger.error(`Fal i2v raw data: ${JSON.stringify(result.data)?.slice(0, 500)}`);
      throw new Error('image_to_video: Fal returned no video URL');
    }
    return videoUrl;
  }
}
