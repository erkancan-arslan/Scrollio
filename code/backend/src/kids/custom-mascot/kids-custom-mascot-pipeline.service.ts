import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fal } from '@fal-ai/client';
import { KidsCustomMascotJobsService } from './kids-custom-mascot-jobs.service';
import { AudioVideoMergeService } from '../../admin-kids/merge/audio-video-merge.service';
import { getMascotFalEndpoints } from './kids-custom-mascot-fal-endpoints';
import {
  buildImageToVideoInput,
  buildModel3dInput,
  buildReframerInput,
  buildUpscalerInput,
} from './kids-custom-mascot-pipeline-inputs';
import { extractFirstImageUrl, extractVideoUrl } from './kids-custom-mascot-fal-response';
import { resolveEnvString } from './kids-custom-mascot-env.util';

/**
 * Pipeline (current_step keys match mobile progress copy):
 * model_3d → reframer → upscaler → image_to_video → merge_audio → done
 */
@Injectable()
export class KidsCustomMascotPipelineService {
  private readonly logger = new Logger(KidsCustomMascotPipelineService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly jobsService: KidsCustomMascotJobsService,
    private readonly mergeService: AudioVideoMergeService,
  ) {}

  async run(jobId: string, imageBase64DataUrl: string, parentUserId: string): Promise<void> {
    const falKey = resolveEnvString(this.config.get<string>('FAL_KEY'), 'FAL_KEY');
    const narrationAudioUrl = resolveEnvString(
      this.config.get<string>('KIDS_CUSTOM_MASCOT_NARRATION_AUDIO_URL'),
      'KIDS_CUSTOM_MASCOT_NARRATION_AUDIO_URL',
    );

    if (!falKey) {
      await this.fail(jobId, 'FAL_KEY is not configured');
      return;
    }
    if (!narrationAudioUrl) {
      await this.fail(jobId, 'KIDS_CUSTOM_MASCOT_NARRATION_AUDIO_URL is not configured');
      return;
    }

    fal.config({ credentials: falKey });
    const endpoints = getMascotFalEndpoints(this.config);

    let job: Awaited<ReturnType<KidsCustomMascotJobsService['findOneForParent']>>;
    try {
      job = await this.jobsService.findOneForParent(jobId, parentUserId);
    } catch {
      this.logger.warn(`run: job ${jobId} not found for user`);
      return;
    }

    try {
      await this.jobsService.updateJob(jobId, {
        status: 'processing',
        currentStep: 'model_3d',
        progressPercent: 4,
        narrationAudioUrl,
        errorMessage: null,
      });

      const mentorImageUrl = await this.falImageStep(
        endpoints.model3d,
        buildModel3dInput(imageBase64DataUrl),
        'model_3d',
      );
      await this.jobsService.updateJob(jobId, {
        mentorImageUrl,
        currentStep: 'reframer',
        progressPercent: 22,
      });

      const reframedUrl = await this.falImageStep(
        endpoints.reframer,
        buildReframerInput(mentorImageUrl),
        'reframer',
      );
      await this.jobsService.updateJob(jobId, {
        portrait9_16ImageUrl: reframedUrl,
        currentStep: 'upscaler',
        progressPercent: 40,
      });

      const upscaledUrl = await this.falImageStep(
        endpoints.upscaler,
        buildUpscalerInput(reframedUrl),
        'upscaler',
      );
      await this.jobsService.updateJob(jobId, {
        upscaledImageUrl: upscaledUrl,
        currentStep: 'image_to_video',
        progressPercent: 58,
      });

      const rawVideoUrl = await this.falVideoStep(
        endpoints.imageToVideo,
        buildImageToVideoInput(upscaledUrl),
      );
      await this.jobsService.updateJob(jobId, {
        rawVideoUrl,
        currentStep: 'merge_audio',
        progressPercent: 78,
      });

      const storagePrefix = `custom-mascot/${job.child_profile_id}/${jobId}`;
      const finalVideoUrl = await this.mergeService.mergeToStorage(rawVideoUrl, narrationAudioUrl, storagePrefix);

      await this.jobsService.updateJob(jobId, {
        finalVideoUrl,
        status: 'ready',
        currentStep: 'done',
        progressPercent: 100,
      });
      this.logger.log(`Custom mascot job ${jobId} completed`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Custom mascot job ${jobId} failed: ${msg}`);
      await this.fail(jobId, msg);
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
      throw new Error(`${stepLabel}: Fal returned no image URL (check model + input shape in kids-custom-mascot-pipeline-inputs.ts)`);
    }
    return url;
  }

  private async falVideoStep(endpoint: string, input: Record<string, unknown>): Promise<string> {
    this.logger.log(`Fal image_to_video → ${endpoint}`);
    const result = await fal.subscribe(endpoint, {
      input,
      timeout: 10 * 60 * 1000, // 10 minutes hard cap
      onQueueUpdate: (update) => {
        if (update.status === 'IN_QUEUE') {
          this.logger.log(`Fal i2v queued — position ${(update as { queue_position?: number }).queue_position ?? '?'}`);
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
