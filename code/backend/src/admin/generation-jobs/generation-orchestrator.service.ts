import { Injectable, Logger } from '@nestjs/common';
import { GenerationJobsService } from './generation-jobs.service';
import { ReferenceVideosService } from '../reference-videos/reference-videos.service';
import { ScriptGenerationService } from '../ai/script-generation.service';
import { TtsService } from '../ai/tts.service';
import { LipsyncService } from '../ai/lipsync.service';
import { GeneratedVideosService } from '../generated-videos/generated-videos.service';
import { FeedPublishingService } from '../feeds/feed-publishing.service';
import { JobLogsService } from '../logs/job-logs.service';
import { JobStatus, JobStep, STEP_PROGRESS } from '../types/admin.types';

@Injectable()
export class GenerationOrchestratorService {
  private readonly logger = new Logger(GenerationOrchestratorService.name);

  constructor(
    private readonly jobsService: GenerationJobsService,
    private readonly referenceVideosService: ReferenceVideosService,
    private readonly scriptService: ScriptGenerationService,
    private readonly ttsService: TtsService,
    private readonly lipsyncService: LipsyncService,
    private readonly generatedVideosService: GeneratedVideosService,
    private readonly feedService: FeedPublishingService,
    private readonly logsService: JobLogsService,
  ) {}

  async runPipeline(jobId: string): Promise<void> {
    this.logger.log(`Starting pipeline for job ${jobId}`);
    try {
      // --- Step 1: Validate input ---
      await this.advanceStep(jobId, JobStep.VALIDATING_INPUT, 'Validating job input');
      const job = await this.jobsService.findOne(jobId);
      if (!job.reference_video_id) {
        throw new Error('Reference video ID is missing');
      }
      await this.logsService.log(jobId, JobStep.VALIDATING_INPUT, 'success', 'Input validated');

      // --- Step 2: Resolve reference video ---
      await this.advanceStep(jobId, JobStep.RESOLVING_REFERENCE_VIDEO, 'Resolving reference video URL');
      const refVideo = await this.referenceVideosService.findOne(job.reference_video_id);
      const referenceVideoUrl = refVideo.public_url || refVideo.storage_path;
      if (!referenceVideoUrl) {
        throw new Error('Reference video has no accessible URL');
      }
      await this.jobsService.updateStatus(jobId, { referenceVideoUrlSnapshot: referenceVideoUrl });
      await this.logsService.log(jobId, JobStep.RESOLVING_REFERENCE_VIDEO, 'success', `Resolved: ${referenceVideoUrl}`);

      // --- Step 3: Generate script ---
      await this.advanceStep(jobId, JobStep.GENERATING_SCRIPT, 'Generating script via LLM');
      const script = await this.scriptService.generate({
        topic: job.topic,
        subject: job.subject,
        contentTarget: job.content_target,
        language: job.language,
        tone: job.tone,
        durationTargetSeconds: job.duration_target_seconds,
        difficulty: job.difficulty,
        customPrompt: job.custom_prompt,
      });
      await this.jobsService.updateStatus(jobId, { generatedScript: script });
      await this.logsService.log(jobId, JobStep.GENERATING_SCRIPT, 'success', `Script generated (${script.length} chars)`);

      // --- Step 4: Clean narration ---
      await this.advanceStep(jobId, JobStep.CLEANING_NARRATION, 'Cleaning narration text');
      const narration = this.cleanNarration(script);
      await this.jobsService.updateStatus(jobId, { cleanedNarrationText: narration });
      await this.logsService.log(jobId, JobStep.CLEANING_NARRATION, 'success', 'Narration cleaned');

      // --- Step 5: Generate TTS ---
      await this.advanceStep(jobId, JobStep.GENERATING_TTS, 'Generating TTS audio');
      const audioUrl = await this.ttsService.generateSpeech(narration, undefined, job.language);
      await this.jobsService.updateStatus(jobId, { audioUrl });
      await this.logsService.log(jobId, JobStep.GENERATING_TTS, 'success', `Audio URL: ${audioUrl}`);

      // --- Step 6: Generate lipsync video ---
      await this.advanceStep(jobId, JobStep.GENERATING_LIPSYNC, 'Generating lipsync video');

      // Pre-check: verify FAL can reach the reference video URL
      try {
        const headRes = await fetch(referenceVideoUrl, { method: 'HEAD' });
        if (!headRes.ok) {
          throw new Error(
            `Reference video URL is not accessible (HTTP ${headRes.status}). ` +
            `Upload the video via the admin panel file picker to use a stable Supabase Storage URL.`,
          );
        }
      } catch (headErr) {
        if (headErr instanceof Error && headErr.message.includes('Reference video URL')) {
          throw headErr;
        }
        this.logger.warn(`HEAD check failed for reference video URL: ${headErr}`);
      }

      const finalVideoUrl = await this.lipsyncService.generate(referenceVideoUrl, audioUrl);
      await this.jobsService.updateStatus(jobId, {
        finalVideoUrl,
        finalVideoProvider: 'veed',
      });
      await this.logsService.log(jobId, JobStep.GENERATING_LIPSYNC, 'success', `Lipsync video: ${finalVideoUrl}`);

      // --- Step 7: Create generated video record ---
      await this.advanceStep(jobId, JobStep.CREATING_GENERATED_VIDEO, 'Creating generated video record');
      const generatedVideo = await this.generatedVideosService.createFromJob({
        jobId,
        title: job.title,
        topic: job.topic,
        subject: job.subject,
        contentTarget: job.content_target,
        language: job.language,
        script: narration,
        audioUrl,
        videoUrl: finalVideoUrl,
        referenceVideoId: job.reference_video_id,
      });
      await this.logsService.log(jobId, JobStep.CREATING_GENERATED_VIDEO, 'success', `Generated video: ${generatedVideo.id}`);

      // --- Step 8: Publish to feed ---
      await this.advanceStep(jobId, JobStep.PUBLISHING_TO_FEED, 'Publishing to feed');
      await this.feedService.publish(generatedVideo.id, job.content_target);
      await this.logsService.log(jobId, JobStep.PUBLISHING_TO_FEED, 'success', `Published to ${job.content_target} feed`);

      // --- Step 9: Done ---
      await this.advanceStep(jobId, JobStep.COMPLETED, 'Pipeline completed');
      await this.jobsService.updateStatus(jobId, {
        status: JobStatus.PUBLISHED,
        progressPercent: 100,
        currentStep: JobStep.COMPLETED,
      });
      await this.logsService.log(jobId, JobStep.COMPLETED, 'success', 'Pipeline completed successfully');

      this.logger.log(`Pipeline completed for job ${jobId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Pipeline failed for job ${jobId}: ${errMsg}`);

      await this.jobsService.updateStatus(jobId, {
        status: JobStatus.FAILED,
        errorMessage: errMsg,
      }).catch(() => {});

      await this.logsService.log(jobId, 'pipeline_error', 'failed', errMsg).catch(() => {});
    }
  }

  private async advanceStep(jobId: string, step: string, message: string) {
    const progress = STEP_PROGRESS[step] ?? 0;
    await this.jobsService.updateStatus(jobId, {
      status: JobStatus.PROCESSING,
      currentStep: step,
      progressPercent: progress,
    });
    this.logger.log(`[${jobId}] ${step} (${progress}%): ${message}`);
  }

  private cleanNarration(script: string): string {
    return script
      .replace(/\*\*.*?\*\*/g, '')
      .replace(/\*.*?\*/g, '')
      .replace(/#+ /g, '')
      .replace(/- /g, '')
      .replace(/\[.*?\]/g, '')
      .replace(/\(.*?\)/g, '')
      .replace(/\n{2,}/g, '\n')
      .trim();
  }
}
