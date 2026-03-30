import { apiClient, ApiResponse } from '../../../services/api/apiClient';
import {
  GenerationJob,
  AdminStats,
  BatchJobDetail,
  BatchJobScripts,
  KidsBatchCreateResponse,
  PaginatedResponse,
  JobLog,
  KidsCatalogTopic,
} from '../types/admin.types';

/** Backend routes under `admin/kids/*` — kids-module video pipelines (cloned from core). */
const PREFIX = '/admin/kids';

// ---- Generation jobs (single video pipeline) ----

export async function createKidsGenerationJob(data: {
  title: string;
  topic: string;
  subject?: string;
  contentTarget: string;
  language: string;
  tone?: string;
  durationTargetSeconds?: number;
  difficulty?: string;
  customPrompt?: string;
  referenceVideoId: string;
  /** Stored on job for kids_content when publishing */
  ageGroup?: '7-9' | '10-12';
  /** Must match kids_topics.name for child feed overlap */
  topicTags?: string[];
}): Promise<ApiResponse<GenerationJob>> {
  return apiClient.post<GenerationJob>(`${PREFIX}/generation-jobs`, data);
}

export async function listKidsCatalogTopics(): Promise<ApiResponse<KidsCatalogTopic[]>> {
  return apiClient.get<KidsCatalogTopic[]>(`${PREFIX}/topics`);
}

export async function createKidsCatalogTopic(data: {
  name: string;
  category?: string;
  iconUrl?: string;
}): Promise<ApiResponse<KidsCatalogTopic>> {
  return apiClient.post<KidsCatalogTopic>(`${PREFIX}/topics`, data);
}

/** One lesson × every kids mascot reference (shared script, ffmpeg audio+video merge, kids_content publish). */
export async function createKidsMascotVideoBundle(data: {
  title: string;
  topic: string;
  subject?: string;
  language: string;
  tone?: string;
  customPrompt?: string;
  ageGroup: '7-9' | '10-12';
  topicTags: string[];
  referenceVideoIds?: string[];
}): Promise<
  ApiResponse<{ kidsGenerationGroupId: string; jobs: Array<{ id: string; title: string; reference_video_id: string }> }>
> {
  return apiClient.post(`${PREFIX}/generation-jobs/bundle`, data);
}

export async function startKidsMascotGroup(
  groupId: string,
): Promise<ApiResponse<{ message: string; groupId: string }>> {
  return apiClient.post<{ message: string; groupId: string }>(
    `${PREFIX}/generation-jobs/groups/${groupId}/start`,
    {},
  );
}

export async function startKidsGenerationJob(id: string): Promise<ApiResponse<{ message: string; jobId: string }>> {
  return apiClient.post<{ message: string; jobId: string }>(`${PREFIX}/generation-jobs/${id}/start`);
}

export async function retryKidsGenerationJob(id: string): Promise<ApiResponse<{ message: string; jobId: string }>> {
  return apiClient.post<{ message: string; jobId: string }>(`${PREFIX}/generation-jobs/${id}/retry`);
}

export async function listKidsGenerationJobs(filters?: {
  status?: string;
  language?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<PaginatedResponse<GenerationJob>>> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.language) params.set('language', filters.language);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return apiClient.get<PaginatedResponse<GenerationJob>>(
    `${PREFIX}/generation-jobs${qs ? `?${qs}` : ''}`,
  );
}

export async function getKidsGenerationJob(id: string): Promise<ApiResponse<GenerationJob>> {
  return apiClient.get<GenerationJob>(`${PREFIX}/generation-jobs/${id}`);
}

export async function getKidsAdminStats(): Promise<ApiResponse<AdminStats>> {
  return apiClient.get<AdminStats>(`${PREFIX}/generation-jobs/stats`);
}

export async function getKidsJobLogs(jobId: string): Promise<ApiResponse<JobLog[]>> {
  return apiClient.get<JobLog[]>(`${PREFIX}/generation-jobs/${jobId}/logs`);
}

// ---- Batch jobs (N lesson angles × each kids mascot; no difficulty tiers) ----

export async function createKidsBatchJob(data: {
  videoCount: number;
  title: string;
  topic: string;
  subject?: string;
  language: string;
  tone?: 'formal' | 'friendly' | 'energetic';
  customPrompt?: string;
  ageGroup: '7-9' | '10-12';
  topicTags: string[];
  referenceVideoIds?: string[];
}): Promise<ApiResponse<KidsBatchCreateResponse>> {
  return apiClient.post<KidsBatchCreateResponse>(`${PREFIX}/batch-jobs`, data);
}

export async function getKidsBatchJob(id: string): Promise<ApiResponse<BatchJobDetail>> {
  return apiClient.get<BatchJobDetail>(`${PREFIX}/batch-jobs/${id}`);
}

export async function listKidsBatchJobs(filters?: { limit?: number; offset?: number }): Promise<
  ApiResponse<PaginatedResponse<BatchJobDetail['batch']>>
> {
  const params = new URLSearchParams();
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return apiClient.get<PaginatedResponse<BatchJobDetail['batch']>>(
    `${PREFIX}/batch-jobs${qs ? `?${qs}` : ''}`,
  );
}

/** Optional per-job title/subTopic edits, then run full pipeline for every job (script → TTS → merge → publish). Body `{}` = use suggestions. */
export async function startKidsBatchPipeline(
  batchId: string,
  body?: { jobs?: Array<{ jobId: string; title: string; subTopic: string }> },
): Promise<ApiResponse<{ message: string; batchId: string; jobCount: number }>> {
  return apiClient.post<{ message: string; batchId: string; jobCount: number }>(
    `${PREFIX}/batch-jobs/${batchId}/start-pipeline`,
    body ?? {},
  );
}

/** @deprecated Use `startKidsBatchPipeline` — old endpoint name. */
export async function generateKidsBatchScripts(
  batchId: string,
  body?: { jobs?: Array<{ jobId: string; title: string; subTopic: string }> },
): Promise<ApiResponse<{ message: string; batchId: string; jobCount: number }>> {
  return startKidsBatchPipeline(batchId, body);
}

/** @deprecated Prefer `startKidsBatchPipeline` — same backend behavior. */
export async function approveTopicsKids(
  batchId: string,
  jobs: Array<{ jobId: string; title: string; subTopic: string }>,
): Promise<ApiResponse<{ message: string; batchId: string; jobCount: number }>> {
  return apiClient.post<{ message: string; batchId: string; jobCount: number }>(
    `${PREFIX}/batch-jobs/${batchId}/approve-topics`,
    { jobs },
  );
}

export async function getKidsBatchScripts(batchId: string): Promise<ApiResponse<BatchJobScripts>> {
  return apiClient.get<BatchJobScripts>(`${PREFIX}/batch-jobs/${batchId}/scripts`);
}

export async function approveScriptKids(
  batchId: string,
  jobId: string,
  script?: string,
): Promise<ApiResponse<{ message: string; batchId: string; jobId: string }>> {
  return apiClient.post<{ message: string; batchId: string; jobId: string }>(
    `${PREFIX}/batch-jobs/${batchId}/approve-script/${jobId}`,
    { script },
  );
}
