-- Batch video generation: generation_batches table, batch_id on jobs,
-- difficulty + thumbnail_url on generated_videos, and generated-thumbnails bucket

-- ============================================================
-- 1. generation_batches
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generation_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    subject TEXT,
    content_target TEXT NOT NULL CHECK (content_target IN ('core', 'kids')),
    language TEXT NOT NULL CHECK (language IN ('tr', 'en')),
    tone TEXT NOT NULL DEFAULT 'friendly' CHECK (tone IN ('formal', 'friendly', 'energetic')),
    reference_video_id UUID NOT NULL REFERENCES public.reference_videos(id),
    custom_prompt TEXT,
    total_jobs INTEGER NOT NULL DEFAULT 15,
    completed_jobs INTEGER NOT NULL DEFAULT 0,
    failed_jobs INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_generation_batches" ON public.generation_batches
    FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_generation_batches_status
    ON public.generation_batches (status);

CREATE INDEX IF NOT EXISTS idx_generation_batches_created_by
    ON public.generation_batches (created_by);

-- ============================================================
-- 2. Add batch_id FK to generated_video_jobs
-- ============================================================
ALTER TABLE public.generated_video_jobs
    ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.generation_batches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_generated_video_jobs_batch_id
    ON public.generated_video_jobs (batch_id)
    WHERE batch_id IS NOT NULL;

-- ============================================================
-- 3. Add difficulty and thumbnail_url to generated_videos
-- ============================================================
ALTER TABLE public.generated_videos
    ADD COLUMN IF NOT EXISTS difficulty TEXT,
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- ============================================================
-- 4. Add thumbnail_url to generated_video_jobs (to track mid-pipeline)
-- ============================================================
ALTER TABLE public.generated_video_jobs
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- ============================================================
-- 5. generated-thumbnails storage bucket
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'generated-thumbnails',
    'generated-thumbnails',
    true,
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Allow service role full access to the bucket
CREATE POLICY "service_role_all_generated_thumbnails"
    ON storage.objects FOR ALL
    USING (bucket_id = 'generated-thumbnails' AND auth.role() = 'service_role');

-- Allow public read
CREATE POLICY "public_read_generated_thumbnails"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'generated-thumbnails');
