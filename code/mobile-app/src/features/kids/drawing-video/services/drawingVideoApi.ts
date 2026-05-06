/**
 * Kids 48h drawing-video API client.
 * Endpoints exposed by KidsDrawingVideoController on the backend.
 */

import { kidsApi, TIMEOUT_MS_LONG } from '../../shared/utils/api';

export type KidsDrawingVideoJobStatus =
  | 'queued'
  | 'processing'
  | 'ready'
  | 'failed'
  | 'skipped';

export interface KidsDrawingVideoJobDto {
  id: string;
  status: KidsDrawingVideoJobStatus;
  currentStep: string | null;
  progressPercent: number;
  videoUrl: string | null;
  pinnedUntil: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface KidsDrawingVideoCycleStatusDto {
  serverNow: string;
  cycleDueAt: string;
  lastGeneratedAt: string | null;
  pinnedVideoUrl: string | null;
  pinnedUntil: string | null;
  latestJob: KidsDrawingVideoJobDto | null;
}

export type TickResult =
  | { status: 'not_due'; cycleDueAt: string }
  | { status: 'already_running'; jobId: string }
  | { status: 'no_drawing'; cycleDueAt: string }
  | { status: 'started'; jobId: string };

export type StartFromCanvasResult =
  | { status: 'already_running'; jobId: string }
  | { status: 'started'; jobId: string };

export function getCycleStatus() {
  return kidsApi.get<KidsDrawingVideoCycleStatusDto>('/kids/drawing-videos/cycle-status');
}

export function tickCycle() {
  return kidsApi.post<TickResult>('/kids/drawing-videos/tick', undefined, true, {
    timeoutMs: TIMEOUT_MS_LONG,
  });
}

export function startFromCanvas(imageBase64DataUrl: string) {
  return kidsApi.post<StartFromCanvasResult>(
    '/kids/drawing-videos/start-from-canvas',
    { imageBase64DataUrl },
    true,
    { timeoutMs: TIMEOUT_MS_LONG },
  );
}

export function getJob(jobId: string) {
  return kidsApi.get<{ job: KidsDrawingVideoJobDto }>(`/kids/drawing-videos/jobs/${jobId}`);
}
