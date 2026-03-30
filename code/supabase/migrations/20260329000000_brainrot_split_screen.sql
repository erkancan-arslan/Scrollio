-- ============================================================================
-- Brainrot split-screen video composition
-- Adds type column to reference_videos, brainrot_video_id to batches/jobs,
-- composed_video_url to jobs, and creates the composed-videos storage bucket.
-- ============================================================================

-- 1. Add type column to reference_videos (reference = lipsync avatar, brainrot = gameplay)
ALTER TABLE public.reference_videos
  ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'reference'
  CHECK (type IN ('reference', 'brainrot'));

CREATE INDEX IF NOT EXISTS idx_reference_videos_type
  ON public.reference_videos (type);

-- 2. Add brainrot_video_id to generation_batches
ALTER TABLE public.generation_batches
  ADD COLUMN IF NOT EXISTS brainrot_video_id UUID REFERENCES public.reference_videos(id);

-- 3. Add brainrot_video_id and composed_video_url to generated_video_jobs
ALTER TABLE public.generated_video_jobs
  ADD COLUMN IF NOT EXISTS brainrot_video_id UUID REFERENCES public.reference_videos(id);

ALTER TABLE public.generated_video_jobs
  ADD COLUMN IF NOT EXISTS composed_video_url TEXT;

-- 4. Create composed-videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'composed-videos',
  'composed-videos',
  true,
  524288000, -- 500 MB
  ARRAY['video/mp4']
)
ON CONFLICT (id) DO NOTHING;

-- Service role full access
CREATE POLICY "service_role_all_composed_videos"
  ON storage.objects FOR ALL
  USING (bucket_id = 'composed-videos' AND (SELECT auth.role()) = 'service_role');

-- Public read access
CREATE POLICY "public_read_composed_videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'composed-videos');
