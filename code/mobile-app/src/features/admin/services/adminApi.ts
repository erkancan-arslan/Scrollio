import { apiClient, ApiResponse } from '../../../services/api/apiClient';
import {
  ReferenceVideo,
  GenerationJob,
  GeneratedVideo,
  FeedItem,
  JobLog,
  AdminStats,
  PaginatedResponse,
} from '../types/admin.types';

const PREFIX = '/admin';

// ---- Reference Videos ----

export async function uploadReferenceVideo(data: {
  title: string;
  description?: string;
  personaName?: string;
  language: string;
  audienceTag?: string;
  storagePath: string;
  publicUrl?: string;
  durationSeconds?: number;
  thumbnailUrl?: string;
}): Promise<ApiResponse<ReferenceVideo>> {
  return apiClient.post<ReferenceVideo>(`${PREFIX}/reference-videos`, data);
}

export async function listReferenceVideos(filters?: {
  language?: string;
  audienceTag?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<PaginatedResponse<ReferenceVideo>>> {
  const params = new URLSearchParams();
  if (filters?.language) params.set('language', filters.language);
  if (filters?.audienceTag) params.set('audienceTag', filters.audienceTag);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return apiClient.get<PaginatedResponse<ReferenceVideo>>(
    `${PREFIX}/reference-videos${qs ? `?${qs}` : ''}`,
  );
}

export async function getReferenceVideo(id: string): Promise<ApiResponse<ReferenceVideo>> {
  return apiClient.get<ReferenceVideo>(`${PREFIX}/reference-videos/${id}`);
}

export async function updateReferenceVideo(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    personaName: string;
    language: string;
    audienceTag: string;
    publicUrl: string;
    thumbnailUrl: string;
    status: string;
  }>,
): Promise<ApiResponse<ReferenceVideo>> {
  return apiClient.patch<ReferenceVideo>(`${PREFIX}/reference-videos/${id}`, data);
}

export async function deleteReferenceVideo(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
  return apiClient.delete<{ deleted: boolean }>(`${PREFIX}/reference-videos/${id}`);
}

// ---- Generation Jobs ----

export async function createGenerationJob(data: {
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
}): Promise<ApiResponse<GenerationJob>> {
  return apiClient.post<GenerationJob>(`${PREFIX}/generation-jobs`, data);
}

export async function startGenerationJob(id: string): Promise<ApiResponse<{ message: string; jobId: string }>> {
  return apiClient.post<{ message: string; jobId: string }>(`${PREFIX}/generation-jobs/${id}/start`);
}

export async function retryGenerationJob(id: string): Promise<ApiResponse<{ message: string; jobId: string }>> {
  return apiClient.post<{ message: string; jobId: string }>(`${PREFIX}/generation-jobs/${id}/retry`);
}

export async function listGenerationJobs(filters?: {
  status?: string;
  contentTarget?: string;
  language?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<PaginatedResponse<GenerationJob>>> {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.contentTarget) params.set('contentTarget', filters.contentTarget);
  if (filters?.language) params.set('language', filters.language);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return apiClient.get<PaginatedResponse<GenerationJob>>(
    `${PREFIX}/generation-jobs${qs ? `?${qs}` : ''}`,
  );
}

export async function getGenerationJob(id: string): Promise<ApiResponse<GenerationJob>> {
  return apiClient.get<GenerationJob>(`${PREFIX}/generation-jobs/${id}`);
}

export async function getAdminStats(): Promise<ApiResponse<AdminStats>> {
  return apiClient.get<AdminStats>(`${PREFIX}/generation-jobs/stats`);
}

// ---- Generated Videos ----

export async function listGeneratedVideos(filters?: {
  contentTarget?: string;
  status?: string;
  language?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<PaginatedResponse<GeneratedVideo>>> {
  const params = new URLSearchParams();
  if (filters?.contentTarget) params.set('contentTarget', filters.contentTarget);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.language) params.set('language', filters.language);
  if (filters?.search) params.set('search', filters.search);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return apiClient.get<PaginatedResponse<GeneratedVideo>>(
    `${PREFIX}/generated-videos${qs ? `?${qs}` : ''}`,
  );
}

export async function getGeneratedVideo(id: string): Promise<ApiResponse<GeneratedVideo>> {
  return apiClient.get<GeneratedVideo>(`${PREFIX}/generated-videos/${id}`);
}

export async function publishVideo(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient.post<{ message: string }>(`${PREFIX}/generated-videos/${id}/publish`);
}

export async function unpublishVideo(id: string): Promise<ApiResponse<{ message: string }>> {
  return apiClient.post<{ message: string }>(`${PREFIX}/generated-videos/${id}/unpublish`);
}

// ---- Job Logs (inline via job detail) ----

export async function getJobLogs(jobId: string): Promise<ApiResponse<JobLog[]>> {
  return apiClient.get<JobLog[]>(`${PREFIX}/generation-jobs/${jobId}/logs`);
}

// ---- Feed Items ----

export async function listFeedItems(filters?: {
  feedType?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<PaginatedResponse<FeedItem>>> {
  const params = new URLSearchParams();
  if (filters?.feedType) params.set('feedType', filters.feedType);
  if (filters?.limit) params.set('limit', String(filters.limit));
  if (filters?.offset) params.set('offset', String(filters.offset));
  const qs = params.toString();
  return apiClient.get<PaginatedResponse<FeedItem>>(
    `${PREFIX}/feed-items${qs ? `?${qs}` : ''}`,
  );
}
