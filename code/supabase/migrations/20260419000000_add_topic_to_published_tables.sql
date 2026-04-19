-- Add a simple topic TEXT column to the published content tables.
-- This mirrors the topic field already on generated_video_jobs / generated_videos
-- so admins can sort and filter content by topic without dealing with the tags arrays.

-- kids_content: plain topic string alongside the existing topic_tags array
ALTER TABLE public.kids_content
  ADD COLUMN IF NOT EXISTS topic TEXT;

CREATE INDEX IF NOT EXISTS idx_kids_content_topic
  ON public.kids_content (topic);

-- videos: plain topic string alongside the existing tags array
ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS topic TEXT;

CREATE INDEX IF NOT EXISTS idx_videos_topic
  ON public.videos (topic);

-- Backfill kids_content from the first element of topic_tags where topic is NULL
UPDATE public.kids_content
SET topic = topic_tags[1]
WHERE topic IS NULL AND array_length(topic_tags, 1) > 0;

-- Backfill videos from source_generated_video_id → generated_videos.topic
UPDATE public.videos v
SET topic = gv.topic
FROM public.generated_videos gv
WHERE v.source_generated_video_id = gv.id
  AND v.topic IS NULL;
