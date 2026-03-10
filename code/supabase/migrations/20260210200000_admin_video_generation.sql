-- Admin Video Generation System
-- Tables: reference_videos, generated_video_jobs, generated_videos, feed_items, generation_job_logs

-- ============================================================
-- 1. reference_videos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.reference_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    persona_name TEXT,
    language TEXT NOT NULL CHECK (language IN ('tr', 'en')),
    audience_tag TEXT CHECK (audience_tag IS NULL OR audience_tag IN ('core', 'kids')),
    storage_path TEXT NOT NULL,
    public_url TEXT,
    duration_seconds INTEGER,
    thumbnail_url TEXT,
    status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'processing', 'failed')),
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reference_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_reference_videos" ON public.reference_videos
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_reference_videos_language_audience
    ON public.reference_videos (language, audience_tag);

CREATE INDEX IF NOT EXISTS idx_reference_videos_status
    ON public.reference_videos (status);

-- ============================================================
-- 2. generated_video_jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generated_video_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    subject TEXT,
    content_target TEXT NOT NULL CHECK (content_target IN ('core', 'kids')),
    language TEXT NOT NULL CHECK (language IN ('tr', 'en')),
    tone TEXT NOT NULL DEFAULT 'friendly' CHECK (tone IN ('formal', 'friendly', 'energetic')),
    duration_target_seconds INTEGER,
    difficulty TEXT,
    custom_prompt TEXT,
    reference_video_id UUID NOT NULL REFERENCES public.reference_videos(id),
    reference_video_url_snapshot TEXT,
    generated_script TEXT,
    cleaned_narration_text TEXT,
    audio_url TEXT,
    final_video_url TEXT,
    final_video_provider TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'queued', 'processing', 'published', 'failed')),
    current_step TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    processing_logs JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_generated_video_jobs" ON public.generated_video_jobs
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_generated_video_jobs_status
    ON public.generated_video_jobs (status);

CREATE INDEX IF NOT EXISTS idx_generated_video_jobs_content_target
    ON public.generated_video_jobs (content_target);

CREATE INDEX IF NOT EXISTS idx_generated_video_jobs_reference
    ON public.generated_video_jobs (reference_video_id);

-- ============================================================
-- 3. generated_videos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generated_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.generated_video_jobs(id) UNIQUE,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    subject TEXT,
    content_target TEXT NOT NULL CHECK (content_target IN ('core', 'kids')),
    language TEXT NOT NULL CHECK (language IN ('tr', 'en')),
    script TEXT,
    audio_url TEXT,
    video_url TEXT NOT NULL,
    reference_video_id UUID REFERENCES public.reference_videos(id),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'archived')),
    published_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_generated_videos" ON public.generated_videos
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_generated_videos_content_target
    ON public.generated_videos (content_target);

CREATE INDEX IF NOT EXISTS idx_generated_videos_status
    ON public.generated_videos (status);

-- ============================================================
-- 4. feed_items
-- ============================================================
CREATE TABLE IF NOT EXISTS public.feed_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generated_video_id UUID NOT NULL REFERENCES public.generated_videos(id),
    feed_type TEXT NOT NULL CHECK (feed_type IN ('core', 'kids')),
    sort_order INTEGER,
    is_published BOOLEAN NOT NULL DEFAULT true,
    published_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_feed_items" ON public.feed_items
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_feed_items_feed_type_published
    ON public.feed_items (feed_type, is_published);

CREATE INDEX IF NOT EXISTS idx_feed_items_generated_video
    ON public.feed_items (generated_video_id);

-- ============================================================
-- 5. generation_job_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generation_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.generated_video_jobs(id) ON DELETE CASCADE,
    step_name TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT NOT NULL,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_generation_job_logs" ON public.generation_job_logs
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_generation_job_logs_job
    ON public.generation_job_logs (job_id, created_at);
