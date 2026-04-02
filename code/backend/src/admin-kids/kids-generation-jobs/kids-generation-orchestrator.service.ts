import { Injectable, Logger } from '@nestjs/common';
import { KidsGenerationJobsService } from './kids-generation-jobs.service';
import { ReferenceVideosService } from '../../admin/reference-videos/reference-videos.service';
import { ScriptGenerationService } from '../../admin/ai/script-generation.service';
import { TtsService } from '../../admin/ai/tts.service';
import { AudioVideoMergeService } from '../merge/audio-video-merge.service';
import { KidsVoiceService } from '../kids-voice.service';
import { ThumbnailService } from '../../admin/ai/thumbnail.service';
import { GeneratedVideosService } from '../../admin/generated-videos/generated-videos.service';
import { FeedPublishingService } from '../../admin/feeds/feed-publishing.service';
import { JobLogsService } from '../../admin/logs/job-logs.service';
import { JobStatus, JobStep, STEP_PROGRESS } from '../../admin/types/admin.types';
import { SubtitleService } from '../../admin/ai/subtitle.service';

interface JobState {
  job: Record<string, any>;
  narration: string;
  audioUrl: string;
  videoUrl: string;
  thumbnailUrl: string;
}

interface JobStateWithRecord extends JobState {
  generatedVideoId: string;
}

interface AudioRefState {
  state: JobState;
  audioUrl: string;
  refUrl: string;
}

@Injectable()
export class KidsGenerationOrchestratorService {
  private readonly logger = new Logger(KidsGenerationOrchestratorService.name);

  constructor(
    private readonly jobsService: KidsGenerationJobsService,
    private readonly referenceVideosService: ReferenceVideosService,
    private readonly scriptService: ScriptGenerationService,
    private readonly ttsService: TtsService,
    private readonly mergeService: AudioVideoMergeService,
    private readonly kidsVoice: KidsVoiceService,
    private readonly thumbnailService: ThumbnailService,
    private readonly generatedVideosService: GeneratedVideosService,
    private readonly feedService: FeedPublishingService,
    private readonly logsService: JobLogsService,
    private readonly subtitleService: SubtitleService,
  ) {}

  /** Single job: script → TTS (mascot voice) → ffmpeg merge → thumbnail → publish (kids_content + feed_items). */
  async runPipeline(jobId: string): Promise<void> {
    this.logger.log(`[kids] Starting pipeline for job ${jobId}`);
    try {
      await this.advanceStep(jobId, JobStep.VALIDATING_INPUT, 'Validating job input');
      const job = await this.jobsService.findOne(jobId);
      if (!job.reference_video_id) throw new Error('Reference video ID is missing');
      await this.logsService.log(jobId, JobStep.VALIDATING_INPUT, 'success', 'Input validated');

      await this.advanceStep(jobId, JobStep.RESOLVING_REFERENCE_VIDEO, 'Resolving reference video URL');
      const refVideo = await this.referenceVideosService.findOne(job.reference_video_id);
      const referenceVideoUrl = refVideo.public_url || refVideo.storage_path;
      if (!referenceVideoUrl) throw new Error('Reference video has no accessible URL');
      await this.jobsService.updateStatus(jobId, { referenceVideoUrlSnapshot: referenceVideoUrl });
      await this.logsService.log(jobId, JobStep.RESOLVING_REFERENCE_VIDEO, 'success', `Resolved: ${referenceVideoUrl}`);

      await this.advanceStep(jobId, JobStep.GENERATING_SCRIPT, 'Generating script via LLM');
      const script = await this.scriptService.generate({
        topic: job.topic,
        subject: job.subject,
        contentTarget: job.content_target,
        language: job.language,
        tone: job.tone,
        durationTargetSeconds: job.duration_target_seconds,
        difficulty: job.difficulty ?? undefined,
        customPrompt: job.custom_prompt,
      });
      await this.jobsService.updateStatus(jobId, { generatedScript: script });
      await this.logsService.log(jobId, JobStep.GENERATING_SCRIPT, 'success', `Script generated (${script.length} chars)`);

      await this.advanceStep(jobId, JobStep.CLEANING_NARRATION, 'Cleaning narration text');
      const narration = this.cleanNarration(script);
      await this.jobsService.updateStatus(jobId, { cleanedNarrationText: narration });
      await this.logsService.log(jobId, JobStep.CLEANING_NARRATION, 'success', 'Narration cleaned');

      await this.runKidsRenderAfterScript(jobId, narration);
      this.logger.log(`[kids] Pipeline completed for job ${jobId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[kids] Pipeline failed for job ${jobId}: ${errMsg}`);
      await this.jobsService.updateStatus(jobId, { status: JobStatus.FAILED, errorMessage: errMsg }).catch(() => {});
      await this.logsService.log(jobId, 'pipeline_error', 'failed', errMsg).catch(() => {});
    }
  }

  /** One shared script, then parallel render per mascot job in the group. */
  async runMascotGroupPipeline(groupId: string): Promise<void> {
    this.logger.log(`[kids] Starting mascot group pipeline ${groupId}`);
    let jobs: Record<string, any>[];
    try {
      jobs = await this.jobsService.findJobsByGroupId(groupId);
    } catch {
      this.logger.warn(`[kids] Group not found: ${groupId}`);
      return;
    }

    try {
      const first = jobs[0];
      await Promise.all(
        jobs.map((j) =>
          this.advanceStep(j.id, JobStep.GENERATING_SCRIPT, j.id === first.id ? 'Generating shared script' : 'Queued for shared script'),
        ),
      );

      const script = await this.scriptService.generate({
        topic: first.topic,
        subject: first.subject,
        contentTarget: first.content_target,
        language: first.language,
        tone: first.tone,
        durationTargetSeconds: first.duration_target_seconds,
        difficulty: undefined,
        customPrompt: first.custom_prompt,
      });
      const narration = this.cleanNarration(script);

      await Promise.all(
        jobs.map((j) =>
          this.jobsService.updateStatus(j.id, {
            generatedScript: script,
            cleanedNarrationText: narration,
          }),
        ),
      );
      await this.logsService.log(first.id, JobStep.GENERATING_SCRIPT, 'success', `Script generated (${script.length} chars)`);

      await Promise.all(
        jobs.map((j) => this.advanceStep(j.id, JobStep.CLEANING_NARRATION, 'Narration ready')),
      );
      await Promise.all(
        jobs.map((j) => this.logsService.log(j.id, JobStep.CLEANING_NARRATION, 'success', 'Narration cleaned')),
      );

      await Promise.allSettled(
        jobs.map((j) =>
          this.runKidsRenderAfterScript(j.id, narration).catch(async (err) => {
            const errMsg = err instanceof Error ? err.message : String(err);
            await this.failJob(j.id, errMsg);
          }),
        ),
      );
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[kids] Group script phase failed: ${errMsg}`);
      await Promise.allSettled(jobs.map((j) => this.failJob(j.id, `group script: ${errMsg}`)));
    }
  }

  async generateScriptsForBatch(jobIds: string[]): Promise<void> {
    this.logger.log(`[kids] Generating scripts for ${jobIds.length} jobs`);

    const jobs = await Promise.all(jobIds.map((id) => this.jobsService.findOne(id)));

    const CHUNK_SIZE = 10;
    for (let start = 0; start < jobs.length; start += CHUNK_SIZE) {
      const chunk = jobs.slice(start, start + CHUNK_SIZE);
      this.logger.log(`[kids] Script generation chunk ${start / CHUNK_SIZE + 1}: ${chunk.length} jobs`);

      const results = await Promise.allSettled(
        chunk.map((job) =>
          this.scriptService.generate({
            topic: job.topic,
            subject: job.subject,
            contentTarget: job.content_target,
            language: job.language,
            tone: job.tone,
            durationTargetSeconds: job.duration_target_seconds,
            difficulty: job.difficulty ?? undefined,
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
            this.logger.log(`[kids] Script generated for job ${job.id} (${script.length} chars)`);
          } else {
            const msg = this.errMsg(result.reason);
            this.logger.error(`[kids] Script generation failed for job ${job.id}: ${msg}`);
            await this.jobsService
              .updateStatus(job.id, {
                status: JobStatus.FAILED,
                errorMessage: `Script generation failed: ${msg}`,
              })
              .catch(() => {});
          }
        }),
      );
    }
  }

  async runVideoFromApprovedScript(jobId: string): Promise<void> {
    this.logger.log(`[kids] Starting video-from-script pipeline for job ${jobId}`);
    try {
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

      await this.runKidsRenderAfterScript(jobId, narration);
      this.logger.log(`[kids] Video-from-script pipeline completed for job ${jobId}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`[kids] Video-from-script pipeline failed for job ${jobId}: ${errMsg}`);
      await this.jobsService.updateStatus(jobId, { status: JobStatus.FAILED, errorMessage: errMsg }).catch(() => {});
      await this.logsService.log(jobId, 'pipeline_error', 'failed', errMsg).catch(() => {});
    }
  }

  async runBatchPipeline(batchId: string, jobIds: string[]): Promise<void> {
    this.logger.log(`[kids] Starting batch pipeline ${batchId} (${jobIds.length} jobs)`);

    try {
      const rawJobs = await Promise.all(jobIds.map((id) => this.jobsService.findOne(id)));

      let alive: JobState[] = rawJobs.map((job) => ({
        job,
        narration: '',
        audioUrl: '',
        videoUrl: '',
        thumbnailUrl: '',
      }));

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
            difficulty: s.job.difficulty ?? undefined,
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

      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.GENERATING_TTS, 'Generating TTS')));
      const audioRefResults = await Promise.allSettled(
        alive.map(async (s): Promise<AudioRefState> => {
          const ref = await this.referenceVideosService.findOne(s.job.reference_video_id);
          const refUrl = ref.public_url || ref.storage_path;
          if (!refUrl) throw new Error('Reference video has no accessible URL');
          const voice = this.kidsVoice.voiceForCharacter(ref.character_id);
          const audioUrl = await this.ttsService.generateSpeech(s.narration, voice, s.job.language);
          s.audioUrl = audioUrl;
          await this.jobsService.updateStatus(s.job.id, { audioUrl });
          return { state: s, audioUrl, refUrl };
        }),
      );

      const withAudio: AudioRefState[] = [];
      for (let i = 0; i < audioRefResults.length; i++) {
        const r = audioRefResults[i];
        if (r.status === 'fulfilled') {
          withAudio.push(r.value);
        } else {
          await this.failJob(alive[i].job.id, `${JobStep.GENERATING_TTS}: ${this.errMsg(r.reason)}`);
        }
      }
      alive = withAudio.map((x) => x.state);
      if (alive.length === 0) return;

      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.GENERATING_LIPSYNC, 'Merging audio with base')));
      const mergeResults = await Promise.allSettled(
        withAudio.map((x) =>
          this.mergeService.mergeToStorage(x.refUrl, x.audioUrl, `kids/batch/${x.state.job.id}`),
        ),
      );

      const mergedStates: JobState[] = [];
      for (let i = 0; i < mergeResults.length; i++) {
        const r = mergeResults[i];
        const st = withAudio[i].state;
        if (r.status === 'fulfilled') {
          st.videoUrl = r.value;
          await this.jobsService.updateStatus(st.job.id, {
            finalVideoUrl: r.value,
            finalVideoProvider: 'ffmpeg_merge',
          });
          mergedStates.push(st);
        } else {
          await this.failJob(st.job.id, `${JobStep.GENERATING_LIPSYNC}: ${this.errMsg(r.reason)}`);
        }
      }
      alive = mergedStates;
      if (alive.length === 0) return;

      // Burn subtitles into all videos in parallel
      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.BURNING_SUBTITLES, 'Burning subtitles')));
      const subtitleResults = await Promise.allSettled(
        alive.map((s) => this.subtitleService.burnIntoVideo(s.videoUrl, s.narration, s.audioUrl, s.job.id)),
      );
      alive = await this.filterSettled(alive, subtitleResults, JobStep.BURNING_SUBTITLES, async (s, subtitledUrl) => {
        s.videoUrl = subtitledUrl;
        await this.jobsService.updateStatus(s.job.id, { finalVideoUrl: subtitledUrl });
      });
      if (alive.length === 0) return;

      await Promise.all(alive.map((s) => this.advanceStep(s.job.id, JobStep.GENERATING_THUMBNAIL, 'Extracting thumbnail')));
      const thumbResults = await Promise.allSettled(
        alive.map((s) => this.thumbnailService.generate(s.videoUrl, s.job.id)),
      );
      alive = await this.filterSettled(alive, thumbResults, JobStep.GENERATING_THUMBNAIL, async (s, thumbnailUrl) => {
        s.thumbnailUrl = thumbnailUrl;
        await this.jobsService.updateStatus(s.job.id, { thumbnailUrl });
      });
      if (alive.length === 0) return;

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
            difficulty: null,
            script: s.narration,
            audioUrl: s.audioUrl,
            videoUrl: s.videoUrl,
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

      this.logger.log(`[kids] Batch pipeline ${batchId} finished. ${withRecords.length}/${jobIds.length} jobs succeeded.`);
    } catch (error) {
      const msg = this.errMsg(error);
      this.logger.error(`[kids] Batch pipeline ${batchId} failed fatally: ${msg}`);
      await Promise.allSettled(jobIds.map((id) => this.failJob(id, `batch pipeline error: ${msg}`)));
    }
  }

  private async runKidsRenderAfterScript(jobId: string, narration: string): Promise<void> {
    const job = await this.jobsService.findOne(jobId);

    await this.advanceStep(jobId, JobStep.GENERATING_TTS, 'Generating TTS audio');
    const refVideo = await this.referenceVideosService.findOne(job.reference_video_id);
    const referenceVideoUrl = refVideo.public_url || refVideo.storage_path;
    if (!referenceVideoUrl) throw new Error('Reference video has no accessible URL');

    const voice = this.kidsVoice.voiceForCharacter(refVideo.character_id);
    const audioUrl = await this.ttsService.generateSpeech(narration, voice, job.language);
    await this.jobsService.updateStatus(jobId, { audioUrl });
    await this.logsService.log(jobId, JobStep.GENERATING_TTS, 'success', `Audio URL: ${audioUrl}`);

    await this.advanceStep(jobId, JobStep.GENERATING_LIPSYNC, 'Merging audio with base animation');
    await this.ensureReferenceHeadOk(referenceVideoUrl);
    let finalVideoUrl = await this.mergeService.mergeToStorage(referenceVideoUrl, audioUrl, `kids/jobs/${jobId}`);
    await this.jobsService.updateStatus(jobId, { finalVideoUrl, finalVideoProvider: 'ffmpeg_merge' });
    await this.logsService.log(jobId, JobStep.GENERATING_LIPSYNC, 'success', `Merged video: ${finalVideoUrl}`);

    await this.advanceStep(jobId, JobStep.BURNING_SUBTITLES, 'Burning subtitles into video');
    finalVideoUrl = await this.subtitleService.burnIntoVideo(finalVideoUrl, narration, audioUrl, jobId);
    await this.jobsService.updateStatus(jobId, { finalVideoUrl });
    await this.logsService.log(jobId, JobStep.BURNING_SUBTITLES, 'success', `Subtitled video: ${finalVideoUrl}`);

    await this.advanceStep(jobId, JobStep.GENERATING_THUMBNAIL, 'Extracting thumbnail from video');
    const thumbnailUrl = await this.thumbnailService.generate(finalVideoUrl, jobId);
    await this.jobsService.updateStatus(jobId, { thumbnailUrl });
    await this.logsService.log(jobId, JobStep.GENERATING_THUMBNAIL, 'success', `Thumbnail: ${thumbnailUrl}`);

    await this.advanceStep(jobId, JobStep.CREATING_GENERATED_VIDEO, 'Creating generated video record');
    const generatedVideo = await this.generatedVideosService.createFromJob({
      jobId,
      title: job.title,
      topic: job.topic,
      subject: job.subject,
      contentTarget: job.content_target,
      language: job.language,
      difficulty: null,
      script: narration,
      audioUrl,
      videoUrl: finalVideoUrl,
      thumbnailUrl,
      referenceVideoId: job.reference_video_id,
    });
    await this.logsService.log(jobId, JobStep.CREATING_GENERATED_VIDEO, 'success', `Generated video: ${generatedVideo.id}`);

    await this.advanceStep(jobId, JobStep.PUBLISHING_TO_FEED, 'Publishing to feed');
    await this.feedService.publish(generatedVideo.id, job.content_target);
    await this.logsService.log(jobId, JobStep.PUBLISHING_TO_FEED, 'success', `Published to ${job.content_target} feed`);

    await this.jobsService.updateStatus(jobId, {
      status: JobStatus.PUBLISHED,
      progressPercent: 100,
      currentStep: JobStep.COMPLETED,
    });
    await this.logsService.log(jobId, JobStep.COMPLETED, 'success', 'Pipeline completed successfully');
  }

  private async ensureReferenceHeadOk(referenceVideoUrl: string): Promise<void> {
    try {
      const headRes = await fetch(referenceVideoUrl, { method: 'HEAD' });
      if (!headRes.ok) {
        throw new Error(
          `Reference video URL is not accessible (HTTP ${headRes.status}). ` +
            `Use a stable Supabase Storage public URL for base animations.`,
        );
      }
    } catch (headErr) {
      if (headErr instanceof Error && headErr.message.includes('Reference video URL')) throw headErr;
      this.logger.warn(`HEAD check failed for reference video URL: ${headErr}`);
    }
  }

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
    this.logger.error(`[kids] Job ${jobId} failed: ${message}`);
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
    this.logger.log(`[kids][${jobId}] ${step} (${progress}%): ${message}`);
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
