-- Track which admin-generated video a core feed video came from
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS source_generated_video_id UUID REFERENCES public.generated_videos(id);

CREATE INDEX IF NOT EXISTS idx_videos_source_generated_video_id
  ON public.videos(source_generated_video_id)
  WHERE source_generated_video_id IS NOT NULL;
