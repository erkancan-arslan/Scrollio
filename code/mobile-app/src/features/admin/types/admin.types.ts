export enum ContentTarget {
  CORE = 'core',
  KIDS = 'kids',
}

export enum JobStatus {
  DRAFT = 'draft',
  QUEUED = 'queued',
  PROCESSING = 'processing',
  PUBLISHED = 'published',
  FAILED = 'failed',
}

export enum Language {
  TR = 'tr',
  EN = 'en',
}

export enum Tone {
  FORMAL = 'formal',
  FRIENDLY = 'friendly',
  ENERGETIC = 'energetic',
}

export interface ReferenceVideo {
  id: string;
  title: string;
  description?: string;
  persona_name?: string;
  language: string;
  audience_tag?: string;
  storage_path: string;
  public_url?: string;
  duration_seconds?: number;
  thumbnail_url?: string;
  status: string;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface GenerationJob {
  id: string;
  title: string;
  topic: string;
  subject?: string;
  content_target: string;
  language: string;
  tone: string;
  duration_target_seconds?: number;
  difficulty?: string;
  custom_prompt?: string;
  reference_video_id: string;
  reference_video_url_snapshot?: string;
  generated_script?: string;
  cleaned_narration_text?: string;
  audio_url?: string;
  final_video_url?: string;
  final_video_provider?: string;
  status: string;
  current_step?: string;
  progress_percent: number;
  error_message?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  reference_videos?: Pick<ReferenceVideo, 'id' | 'title' | 'public_url' | 'thumbnail_url' | 'persona_name'>;
}

export interface GeneratedVideo {
  id: string;
  job_id: string;
  title: string;
  topic: string;
  subject?: string;
  content_target: string;
  language: string;
  script?: string;
  audio_url?: string;
  video_url: string;
  reference_video_id?: string;
  status: string;
  published_by?: string;
  created_at: string;
  updated_at: string;
  feed_items?: FeedItem[];
}

export interface FeedItem {
  id: string;
  generated_video_id: string;
  feed_type: string;
  sort_order?: number;
  is_published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface JobLog {
  id: string;
  job_id: string;
  step_name: string;
  status: string;
  message: string;
  payload?: Record<string, unknown>;
  created_at: string;
}

export interface AdminStats {
  totalJobs: number;
  processingJobs: number;
  failedJobs: number;
  publishedJobs: number;
  totalReferenceVideos: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
}
