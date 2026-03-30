import { kidsApi, TIMEOUT_MS_LONG } from '../../shared/utils/api';

export type KidsCustomMascotJobDto = {
  id: string;
  status: 'queued' | 'processing' | 'ready' | 'failed';
  currentStep: string | null;
  progressPercent: number;
  mentorImageUrl: string | null;
  portrait9_16ImageUrl: string | null;
  upscaledImageUrl: string | null;
  rawVideoUrl: string | null;
  finalVideoUrl: string | null;
  narrationAudioUrl: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export async function createCustomMascotJob(imageBase64: string) {
  return kidsApi.post<{ jobId: string; status: string }>(
    '/kids/custom-mascot/jobs',
    { imageBase64 },
    true,
    { timeoutMs: Math.max(TIMEOUT_MS_LONG, 180_000) },
  );
}

export async function getCustomMascotJob(jobId: string) {
  return kidsApi.get<{ job: KidsCustomMascotJobDto }>(`/kids/custom-mascot/jobs/${jobId}`);
}

export async function getLatestCustomMascotJob() {
  return kidsApi.get<{ job: KidsCustomMascotJobDto | null }>('/kids/custom-mascot/jobs/latest');
}
