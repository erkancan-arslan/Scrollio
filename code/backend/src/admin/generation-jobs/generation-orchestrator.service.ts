import { Injectable, Logger } from '@nestjs/common';
import { GenerationJobsService } from './generation-jobs.service';
import { ReferenceVideosService } from '../reference-videos/reference-videos.service';
import { ScriptGenerationService } from '../ai/script-generation.service';
import { TtsService } from '../ai/tts.service';
import { LipsyncService } from '../ai/lipsync.service';
import { ThumbnailService } from '../ai/thumbnail.service';
import { VideoCompositionService } from '../ai/video-composition.service';
import { GeneratedVideosService } from '../generated-videos/generated-videos.service';
import { FeedPublishingService } from '../feeds/feed-publishing.service';
import { JobLogsService } from '../logs/job-logs.service';
import { JobStatus, JobStep, STEP_PROGRESS } from '../types/admin.types';
import { BunnyCdnService } from '../../bunnycdn/bunnycdn.service';
import { SubtitleService } from '../ai/subtitle.service';

// ─── Types used by the batch pipeline ────────────────────────────────────────

interface JobState {
  job: Record<string, any>;
  narration: string;
  audioUrl: string;
  videoUrl: string;
  composedVideoUrl: string;
  thumbnailUrl: string;
}

interface JobStateWithRecord extends JobState {
  generatedVideoId: string;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class GenerationOrchestratorService {
  private readonly logger = new Logger(GenerationOrchestratorService.name);

  constructor(
    private readonly jobsService: GenerationJobsService,
    private readonly referenceVideosService: ReferenceVideosService,
    private readonly scriptService: ScriptGenerationService,
    private readonly ttsService: TtsService,
    private readonly lipsyncService: LipsyncService,
    private readonly thumbnailService: ThumbnailService,
    private readonly videoCompositionService: VideoCompositionService,
    private readonly generatedVideosService: GeneratedVideosService,
    private readonly feedService: FeedPublishingService,
    private readonly logsService: JobLogsService,
    private readonly bunnyCdnService: BunnyCdnService,
    private readonly subtitleService: SubtitleService,
  ) {}

  // ── Single-job pipeline ────────────────────────────────────────────────────

  async runPipeline(jobId: string): Promise<void> {
    this.logger.log(`Starting pipeline for job ${jobId}`);
    try {
      // Step 1: Validate input
      await this.advanceStep(jobId, JobStep.VALIDATING_INPUT, 'Validating job input');
      const job = await this.jobsService.findOne(jobId);
      if (!job.reference_video_id) throw new Error('Reference video ID is missing');
      await this.logsService.log(jobId, JobStep.VALIDATING_INPUT, 'success', 'Input validated');

      // Step 2: Resolve reference video
      await this.advanceStep(jobId, JobStep.RESOLVING_REFERENCE_VIDEO, 'Resolving reference video URL');
      const refVideo = await this.referenceVideosService.findOne(job.reference_video_id);
      const referenceVideoUrl = refVideo.public_url || refVideo.storage_path;
      if (!referenceVideoUrl) throw new Error('Reference video has no accessible URL');
      await this.jobsService.updateStatus(jobId, { referenceVideoUrlSnapshot: referenceVideoUrl });
      await this.logsService.log(jobId, JobStep.RESOLVING_REFERENCE_VIDEO, 'success', `Resolved: ${referenceVideoUrl}`);

      // Step 3: Generate script
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

      // Step 4: Clean narration
      await this.advanceStep(jobId, JobStep.CLEANING_NARRATION, 'Cleaning narration text');
      const narration = this.cleanNarration(script);
      await this.jobsService.updateStatus(jobId, { cleanedNarrationText: narration });
      await this.logsService.log(jobId, JobStep.CLEANING_NARRATION, 'success', 'Narration cleaned');

      // Step 5: Generate TTS
      await this.advanceStep(jobId, JobStep.GENERATING_TTS, 'Generating TTS audio');
      const audioUrl = await this.ttsService.generateSpeech(narration, undefined, job.language);
      await this.jobsService.updateStatus(jobId, { audioUrl });
      await this.logsService.log(jobId, JobStep.GENERATING_TTS, 'success', `Audio URL: ${audioUrl}`);

      // Step 6: Generate lipsync
      await this.advanceStep(jobId, JobStep.GENERATING_LIPSYNC, 'Generating lipsync video');
      try {
        const headRes = await fetch(referenceVideoUrl, { method: 'HEAD' });
        if (!headRes.ok) {
          throw new Error(
            `Reference video URL is not accessible (HTTP ${headRes.status}). ` +
            `Upload the video via the admin panel file picker to use a stable Supabase Storage URL.`,
          );
        }
      } catch (headErr) {
        if (headErr instanceof Error && headErr.message.includes('Reference video URL')) throw headErr;
        this.logger.warn(`HEAD check failed for reference video URL: ${headErr}`);
      }
      const finalVideoUrl = await this.lipsyncService.generate(referenceVideoUrl, audioUrl);
      await this.jobsService.updateStatus(jobId, { finalVideoUrl, finalVideoProvider: 'veed' });
      await this.logsService.log(jobId, JobStep.GENERATING_LIPSYNC, 'success', `Lipsync video: ${finalVideoUrl}`);

      // Step 6.5: Compose split-screen video (if brainrot video is configured)
      let canonicalVideoUrl = finalVideoUrl;
      if (job.brainrot_video_id) {
        await this.advanceStep(jobId, JobStep.COMPOSING_VIDEO, 'Composing split-screen video');
        const brainrotVideo = await this.referenceVideosService.findOne(job.brainrot_video_id);
        const brainrotVideoUrl = brainrotVideo.public_url || brainrotVideo.storage_path;
        if (!brainrotVideoUrl) throw new Error('Brainrot video has no accessible URL');
        canonicalVideoUrl = await this.videoCompositionService.compose(finalVideoUrl, brainrotVideoUrl, jobId);
        await this.jobsService.updateStatus(jobId, { composedVideoUrl: canonicalVideoUrl });
        await this.logsService.log(jobId, JobStep.COMPOSING_VIDEO, 'success', `Composed video: ${canonicalVideoUrl}`);
      } else {
        await this.advanceStep(jobId, JobStep.COMPOSING_VIDEO, 'Uploading directly to BunnyCDN');
        canonicalVideoUrl = await this.bunnyCdnService.uploadFromUrl(finalVideoUrl, `generated-videos/${jobId}.mp4`);
        await this.jobsService.updateStatus(jobId, { composedVideoUrl: canonicalVideoUrl });
        await this.logsService.log(jobId, JobStep.COMPOSING_VIDEO, 'success', `Uploaded to BunnyCDN: ${canonicalVideoUrl}`);
      }

      // Step 7: Burn subtitles into video
      await this.advanceStep(jobId, JobStep.BURNING_SUBTITLES, 'Burning subtitles into video');
      canonicalVideoUrl = await this.subtitleService.burnIntoVideo(canonicalVideoUrl, narration, audioUrl, jobId);
      await this.jobsService.updateStatus(jobId, { composedVideoUrl: canonicalVideoUrl });
      await this.logsService.log(jobId, JobStep.BURNING_SUBTITLES, 'success', `Subtitled video: ${canonicalVideoUrl}`);

      // Step 8: Extract thumbnail from first frame
      await this.advanceStep(jobId, JobStep.GENERATING_THUMBNAIL, 'Extracting thumbnail from video');
      const thumbnailUrl = await this.thumbnailService.generate(canonicalVideoUrl, jobId);
      await this.jobsService.updateStatus(jobId, { thumbnailUrl });
      await this.logsService.log(jobId, JobStep.GENERATING_THUMBNAIL, 'success', `Thumbnail: ${thumbnailUrl}`);

      // Step 9: Create generated video record
      await this.advanceStep(jobId, JobStep.CREATING_GENERATED_VIDEO, 'Creating generated video record');
      const generatedVideo = await this.generatedVideosService.createFromJob({
        jobId,
        title: job.title,
        topic: job.topic,
        subject: job.subject,
        contentTarget: job.content_target,
        language: job.language,
        difficulty: job.difficulty || null,
        script: narration,
        audioUrl,
        videoUrl: canonicalVideoUrl,
        thumbnailUrl,
        referenceVideoId: job.reference_video_id,
      });
      await this.logsService.log(jobId, JobStep.CREATING_GENERATED_VIDEO, 'success', `Generated video: ${generatedVideo.id}`);

      // Step 10: Publish to feed
      await this.advanceStep(jobId, JobStep.PUBLISHING_TO_FEED, 'Publishing to feed');
      await this.feedService.publish(generatedVideo.id, job.content_target);
      await this.logsService.log(jobId, JobStep.PUBLISHING_TO_FEED, 'success', `Published to ${job.content_target} feed`);

      // Done
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
      await this.jobsService.updateStatus(jobId, { status: JobStatus.FAILED, errorMessage: errMsg }).catch(() => {});
      await this.logsService.log(jobId, 'pipeline_error', 'failed', errMsg).catch(() => {});
    }
  }

  // ── Generate scripts for a batch (no TTS/lipsync yet) ─────────────────────
  // Called after topic approval. Generates and saves scripts for all jobs in
  // chunks to respect the provider concurrency limit (max 10 in-flight).

  async generateScriptsForBatch(jobIds: string[]): Promise<void> {
    this.logger.log(`Generating scripts for ${jobIds.length} jobs`);

    const jobs = await Promise.all(jobIds.map((id) => this.jobsService.findOne(id)));

    // Process in chunks of 10 to stay within the concurrent-request limit
    const CHUNK_SIZE = 10;
    for (let start = 0; start < jobs.length; start += CHUNK_SIZE) {
      const chunk = jobs.slice(start, start + CHUNK_SIZE);
      this.logger.log(`Script generation chunk ${start / CHUNK_SIZE + 1}: ${chunk.length} jobs`);

      const results = await Promise.allSettled(
        chunk.map((job) =>
          this.scriptService.generate({
            topic: job.topic,
            subject: job.subject,
            contentTarget: job.content_target,
            language: job.language,
            tone: job.tone,
            durationTargetSeconds: job.duration_target_seconds,
            difficulty: job.difficulty,
            customPrompt: job.custom_prompt,
          }),
        ),
      );

      await Promise.allSettled(
        results.map(async (result, i) => {
          const job = chunk[i];
          if (result.status === 'fulfilled') {
            const script = result.value;
            const narration = this.cleanNarration(script);
            await this.jobsService.updateStatus(job.id, {
              generatedScript: script,
              cleanedNarrationText: narration,
            });
            this.logger.log(`Script generated for job ${job.id} (${script.length} chars)`);
          } else {
            const msg = this.errMsg(result.reason);
            this.logger.error(`Script generation failed for job ${job.id}: ${msg}`);
            await this.jobsService.updateStatus(job.id, {
              status: JobStatus.FAILED,
              errorMessage: `Script generation failed: ${msg}`,
            }).catch(() => {});
          }
        }),
      );
    }
  }

  // ── Video-from-approved-script pipeline ────────────────────────────────────
  // Used in the interactive batch flow: script was already generated and approved,
  // so we skip straight to TTS → lipsync → thumbnail → record → publish.

  async runVideoFromApprovedScript(jobId: string): Promise<void> {
    this.logger.log(`Starting video-from-script pipeline for job ${jobId}`);
    try {
      // Validate + resolve
      await this.advanceStep(jobId, JobStep.VALIDATING_INPUT, 'Validating job input');
      const job = await this.jobsService.findOne(jobId);
      const narration = job.cleaned_narration_text;
      if (!narration) throw new Error('No approved narration text found on job');
      if (!job.reference_video_id) throw new Error('Reference video ID is missing');
      await this.logsService.log(jobId, JobStep.VALIDATING_INPUT, 'success', 'Input validated');

      await this.advanceStep(jobId, JobStep.RESOLVING_REFERENCE_VIDEO, 'Resolving reference video URL');
      const refVideo = await this.referenceVideosService.findOne(job.reference_video_id);
      const referenceVideoUrl = refVideo.public_url || refVideo.storage_path;
      if (!referenceVideoUrl) throw new Error('Reference video has no accessible URL');
      await this.logsService.log(jobId, JobStep.RESOLVING_REFERENCE_VIDEO, 'success', `Resolved: ${referenceVideoUrl}`);

      // TTS
      await this.advanceStep(jobId, JobStep.GENERATING_TTS, 'Generating TTS audio');
      const audioUrl = await this.ttsService.generateSpeech(narration, undefined, job.language);
      await this.jobsService.updateStatus(jobId, { audioUrl });
      await this.logsService.log(jobId, JobStep.GENERATING_TTS, 'success', `Audio URL: ${audioUrl}`);

      // Lipsync
      await this.advanceStep(jobId, JobStep.GENERATING_LIPSYNC, 'Generating lipsync video');
      try {
        const headRes = await fetch(referenceVideoUrl, { method: 'HEAD' });
        if (!headRes.ok) {
          throw new Error(
            `Reference video URL is not accessible (HTTP ${headRes.status}). ` +
            `Upload the video via the admin panel file picker to use a stable Supabase Storage URL.`,
          );
        }
      } catch (headErr) {
        if (headErr instanceof Error && headErr.message.includes('Reference video URL')) throw headErr;
        this.logger.warn(`HEAD check failed for reference video URL: ${headErr}`);
      }
      const finalVideoUrl = await this.lipsyncService.generate(referenceVideoUrl, audioUrl);
      await this.jobsService.updateStatus(jobId, { finalVideoUrl, finalVideoProvider: 'veed' });
      await this.logsService.log(jobId, JobStep.GENERATING_LIPSYNC, 'success', `Lipsync video: ${finalVideoUrl}`);

      // Compose split-screen video (if brainrot video is configured)
      let canonicalVideoUrl = finalVideoUrl;
      if (job.brainrot_video_id) {
        await this.advanceStep(jobId, JobStep.COMPOSING_VIDEO, 'Composing split-screen video');
        const brainrotVideo = await this.referenceVideosService.findOne(job.brainrot_video_id);
        const brainrotVideoUrl = brainrotVideo.public_url || brainrotVideo.storage_path;
        if (!brainrotVideoUrl) throw new Error('Brainrot video has no accessible URL');
        canonicalVideoUrl = await this.videoCompositionService.compose(finalVideoUrl, brainrotVideoUrl, jobId);
        await this.jobsService.updateStatus(jobId, { composedVideoUrl: canonicalVideoUrl });
        await this.logsService.log(jobId, JobStep.COMPOSING_VIDEO, 'success', `Composed video: ${canonicalVideoUrl}`);
      } else {
        await this.advanceStep(jobId, JobStep.COMPOSING_VIDEO, 'Uploading directly to BunnyCDN');
        canonicalVideoUrl = await this.bunnyCdnService.uploadFromUrl(finalVideoUrl, `generated-videos/${jobId}.mp4`);
        await this.jobsService.updateStatus(jobId, { composedVideoUrl: canonicalVideoUrl });
        await this.logsService.log(jobId, JobStep.COMPOSING_VIDEO, 'success', `Uploaded to BunnyCDN: ${canonicalVideoUrl}`);
      }

      // Burn subtitles
      await this.advanceStep(jobId, JobStep.BURNING_SUBTITLES, 'Burning subtitles into video');
      canonicalVideoUrl = await this.subtitleService.burnIntoVideo(canonicalVideoUrl, narration, audioUrl, jobId);
      await this.jobsService.updateStatus(jobId, { composedVideoUrl: canonicalVideoUrl });
      await this.logsService.log(jobId, JobStep.BURNING_SUBTITLES, 'success', `Subtitled video: ${canonicalVideoUrl}`);

      // Thumbnail
      await this.advanceStep(jobId, JobStep.GENERATING_THUMBNAIL, 'Extracting thumbnail from video');
      const thumbnailUrl = await this.thumbnailService.generate(canonicalVideoUrl, jobId);
      await this.jobsService.updateStatus(jobId, { thumbnailUrl });
      await this.logsService.log(jobId, JobStep.GENERATING_THUMBNAIL, 'success', `Thumbnail: ${thumbnailUrl}`);

      // Create generated_video record
      await this.advanceStep(jobId, JobStep.CREATING_GENERATED_VIDEO, 'Creating generated video record');
      const generatedVideo = await this.generatedVideosService.createFromJob({
        jobId,
        title: job.title,
        topic: job.topic,
        subject: job.subject,
        contentTarget: job.content_target,
        language: job.language,
        difficulty: job.difficulty || null,
        script: narration,
        audioUrl,
        videoUrl: canonicalVideoUrl,
        thumbnailUrl,
        referenceVideoId: job.reference_video_id,
      });
      await this.logsService.log(jobId, JobStep.CREATING_GENERATED_VIDEO, 'success', `Generated video: ${generatedVideo.id}`);

      // Publish
      await this.advanceStep(jobId, JobStep.PUBLISHING_TO_FEED, 'Publishing to feed');
      await this.feedService.publish(generatedVideo.id, job.content_target);
      await this.logsService.log(jobId, JobStep.PUBLISHING_TO_FEED, 'success', `Published to ${job.content_target} feed`);

      // Done
      await this.jobsService.updateStatus(jobId, {
        status: JobStatus.PUBLISHED,
        progressPercent: 100,
        currentStep: JobStep.COMPLETED,
      });
      await this.logsService.log(jobId, JobStep.COMPLETED, 'success', 'Pipeline completed successfully');
      this.logger.log(`Video-from-script pipeline completed for job ${jobId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Video-from-script pipeline failed for job ${jobId}: ${errMsg}`);
      await this.jobsService.updateStatus(jobId, { status: JobStatus.FAILED, errorMessage: errMsg }).catch(() => {});
      await this.logsService.log(jobId, 'pipeline_error', 'failed', errMsg).catch(() => {});
    }
  }

  // ── Batch pipeline ─────────────────────────────────────────────────────────
  // All 15 jobs advance through every step in parallel. At each step the
  // Promise.allSettled fan-out ensures every API call is in-flight at the
  // same time, regardless of how long each individual call takes.

  async runBatchPipeline(batchId: string, jobIds: string[]): Promise<void> {
    this.logger.log(`Starting batch pipeline ${batchId} (${jobIds.length} jobs)`);

    try {
      // Load all jobs simultaneously
      const rawJobs = await Promise.all(jobIds.map((id) => this.jobsService.findOne(id)));

      // Resolve the shared reference video (same for all jobs in a batch)
      const firstJob = rawJobs[0];
      if (!firstJob?.reference_video_id) throw new Error('Reference video ID is missing');

      const refVideo = await this.referenceVideosService.findOne(firstJob.reference_video_id);
      const referenceVideoUrl = refVideo.public_url || refVideo.storage_path;
      if (!referenceVideoUrl) throw new Error('Reference video has no accessible URL');

      // Verify URL is reachable (once for all jobs)
      try {
        const headRes = await fetch(referenceVideoUrl, { method: 'HEAD' });
        if (!headRes.ok) {
          throw new Error(`Reference video URL not accessible (HTTP ${headRes.status})`);
        }
      } catch (headErr) {
        if (headErr instanceof Error && headErr.message.includes('not accessible')) throw headErr;
        this.logger.warn(`HEAD check failed: ${headErr}`);
      }

      // Working state for every alive job
      let alive: JobState[] = rawJobs.map((job) => ({
        job,
        narration: '',
        audioUrl: '',
        videoUrl: '',
        composedVideoUrl: '',
        thumbnailUrl: '',
      }));

      // ── 1. Generate all scripts in parallel ────────────────────────────────
      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.GENERATING_SCRIPT, 'Generating script')));
      const scriptResults = await Promise.allSettled(
        alive.map((s) =>
          this.scriptService.generate({
            topic: s.job.topic,
            subject: s.job.subject,
            contentTarget: s.job.content_target,
            language: s.job.language,
            tone: s.job.tone,
            durationTargetSeconds: s.job.duration_target_seconds,
            difficulty: s.job.difficulty,
            customPrompt: s.job.custom_prompt,
          }),
        ),
      );
      alive = await this.filterSettled(alive, scriptResults, JobStep.GENERATING_SCRIPT, async (s, script) => {
        s.narration = this.cleanNarration(script);
        await this.jobsService.updateStatus(s.job.id, {
          generatedScript: script,
          cleanedNarrationText: s.narration,
        });
      });
      if (alive.length === 0) return;

      // ── 2. Generate all TTS audio in parallel ──────────────────────────────
      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.GENERATING_TTS, 'Generating TTS')));
      const ttsResults = await Promise.allSettled(
        alive.map((s) => this.ttsService.generateSpeech(s.narration, undefined, s.job.language)),
      );
      alive = await this.filterSettled(alive, ttsResults, JobStep.GENERATING_TTS, async (s, audioUrl) => {
        s.audioUrl = audioUrl;
        await this.jobsService.updateStatus(s.job.id, { audioUrl });
      });
      if (alive.length === 0) return;

      // ── 3. Submit all lipsync jobs simultaneously, poll all in parallel ────
      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.GENERATING_LIPSYNC, 'Generating lipsync')));
      const lipsyncResults = await Promise.allSettled(
        alive.map((s) => this.lipsyncService.generate(referenceVideoUrl, s.audioUrl)),
      );
      alive = await this.filterSettled(alive, lipsyncResults, JobStep.GENERATING_LIPSYNC, async (s, videoUrl) => {
        s.videoUrl = videoUrl;
        await this.jobsService.updateStatus(s.job.id, { finalVideoUrl: videoUrl, finalVideoProvider: 'veed' });
      });
      if (alive.length === 0) return;

      // ── 3.5. Compose split-screen videos in parallel (if brainrot configured) ─
      if (firstJob.brainrot_video_id) {
        const brainrotVideo = await this.referenceVideosService.findOne(firstJob.brainrot_video_id);
        const brainrotVideoUrl = brainrotVideo.public_url || brainrotVideo.storage_path;
        if (!brainrotVideoUrl) throw new Error('Brainrot video has no accessible URL');

        await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.COMPOSING_VIDEO, 'Composing split-screen')));
        const composeResults = await Promise.allSettled(
          alive.map((s) => this.videoCompositionService.compose(s.videoUrl, brainrotVideoUrl, s.job.id)),
        );
        alive = await this.filterSettled(alive, composeResults, JobStep.COMPOSING_VIDEO, async (s, composedUrl) => {
          s.composedVideoUrl = composedUrl;
          await this.jobsService.updateStatus(s.job.id, { composedVideoUrl: composedUrl });
        });
        if (alive.length === 0) return;
      } else {
        await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.COMPOSING_VIDEO, 'Uploading to BunnyCDN')));
        const uploadResults = await Promise.allSettled(
          alive.map((s) => this.bunnyCdnService.uploadFromUrl(s.videoUrl, `generated-videos/${s.job.id}.mp4`)),
        );
        alive = await this.filterSettled(alive, uploadResults, JobStep.COMPOSING_VIDEO, async (s, cdnUrl) => {
          s.composedVideoUrl = cdnUrl;
          await this.jobsService.updateStatus(s.job.id, { composedVideoUrl: cdnUrl });
        });
        if (alive.length === 0) return;
      }

      // ── 3.6. Burn subtitles into all videos in parallel ──────────────────
      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.BURNING_SUBTITLES, 'Burning subtitles')));
      const subtitleResults = await Promise.allSettled(
        alive.map((s) => this.subtitleService.burnIntoVideo(s.composedVideoUrl, s.narration, s.audioUrl, s.job.id)),
      );
      alive = await this.filterSettled(alive, subtitleResults, JobStep.BURNING_SUBTITLES, async (s, subtitledUrl) => {
        s.composedVideoUrl = subtitledUrl;
        await this.jobsService.updateStatus(s.job.id, { composedVideoUrl: subtitledUrl });
      });
      if (alive.length === 0) return;

      // ── 4. Extract thumbnails from first frame of all videos in parallel ───
      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.GENERATING_THUMBNAIL, 'Extracting thumbnail')));
      const thumbResults = await Promise.allSettled(
        alive.map((s) => this.thumbnailService.generate(s.composedVideoUrl, s.job.id)),
      );
      alive = await this.filterSettled(alive, thumbResults, JobStep.GENERATING_THUMBNAIL, async (s, thumbnailUrl) => {
        s.thumbnailUrl = thumbnailUrl;
        await this.jobsService.updateStatus(s.job.id, { thumbnailUrl });
      });
      if (alive.length === 0) return;

      // ── 5. Create generated_video records in parallel ──────────────────────
      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.CREATING_GENERATED_VIDEO, 'Creating video record')));
      const recordResults = await Promise.allSettled(
        alive.map((s) =>
          this.generatedVideosService.createFromJob({
            jobId: s.job.id,
            title: s.job.title,
            topic: s.job.topic,
            subject: s.job.subject,
            contentTarget: s.job.content_target,
            language: s.job.language,
            difficulty: s.job.difficulty || null,
            script: s.narration,
            audioUrl: s.audioUrl,
            videoUrl: s.composedVideoUrl,
            thumbnailUrl: s.thumbnailUrl,
            referenceVideoId: s.job.reference_video_id,
          }),
        ),
      );

      const withRecords: JobStateWithRecord[] = [];
      for (let i = 0; i < recordResults.length; i++) {
        const result = recordResults[i];
        if (result.status === 'fulfilled') {
          withRecords.push({ ...alive[i], generatedVideoId: result.value.id });
        } else {
          await this.failJob(alive[i].job.id, `creating_generated_video: ${this.errMsg(result.reason)}`);
        }
      }
      if (withRecords.length === 0) return;

      // ── 6. Publish all to feed in parallel ────────────────────────────────
      await Promise.all(withRecords.map((s) => this.advanceStep(s.job.id, JobStep.PUBLISHING_TO_FEED, 'Publishing to feed')));
      await Promise.allSettled(
        withRecords.map(async (s) => {
          try {
            await this.feedService.publish(s.generatedVideoId, s.job.content_target);
            await this.jobsService.updateStatus(s.job.id, {
              status: JobStatus.PUBLISHED,
              progressPercent: 100,
              currentStep: JobStep.COMPLETED,
            });
            await this.logsService.log(s.job.id, JobStep.COMPLETED, 'success', 'Pipeline completed successfully');
          } catch (err) {
            await this.failJob(s.job.id, `publishing_to_feed: ${this.errMsg(err)}`);
          }
        }),
      );

      this.logger.log(
        `Batch pipeline ${batchId} finished. ${withRecords.length}/${jobIds.length} jobs succeeded.`,
      );
    } catch (error) {
      const msg = this.errMsg(error);
      this.logger.error(`Batch pipeline ${batchId} failed fatally: ${msg}`);
      // Mark all jobs as failed if the pipeline couldn't even start
      await Promise.allSettled(jobIds.map((id) => this.failJob(id, `batch pipeline error: ${msg}`)));
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private async filterSettled<T extends JobState>(
    alive: T[],
    results: PromiseSettledResult<any>[],
    step: string,
    onSuccess: (item: T, value: any) => Promise<void>,
  ): Promise<T[]> {
    const next: T[] = [];
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        await onSuccess(alive[i], result.value);
        next.push(alive[i]);
      } else {
        await this.failJob(alive[i].job.id, `${step}: ${this.errMsg(result.reason)}`);
      }
    }
    return next;
  }

  private async failJob(jobId: string, message: string): Promise<void> {
    this.logger.error(`Job ${jobId} failed: ${message}`);
    await this.jobsService.updateStatus(jobId, { status: JobStatus.FAILED, errorMessage: message }).catch(() => {});
    await this.logsService.log(jobId, 'pipeline_error', 'failed', message).catch(() => {});
  }

  private async advanceStep(jobId: string, step: string, message: string): Promise<void> {
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

  private errMsg(err: unknown): string {
    return err instanceof Error ? err.message : String(err);
  }
}
