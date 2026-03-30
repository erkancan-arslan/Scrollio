-- Kids admin pipeline: feed metadata on jobs + storage for merged mascot videos

ALTER TABLE public.generated_video_jobs
    ADD COLUMN IF NOT EXISTS kids_age_group TEXT
        CHECK (kids_age_group IS NULL OR kids_age_group IN ('7-9', '10-12')),
    ADD COLUMN IF NOT EXISTS kids_topic_tags TEXT[] DEFAULT NULL;

COMMENT ON COLUMN public.generated_video_jobs.kids_age_group IS
    'Target age band for kids_content when publishing (required for mascot bundle flow).';

COMMENT ON COLUMN public.generated_video_jobs.kids_topic_tags IS
    'Topic tag names for kids feed filtering (overlap with kids_child_topics).';

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'kids-generated-videos',
    'kids-generated-videos',
    true,
    104857600, -- 100 MB
    ARRAY['video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "service_role_all_kids_generated_videos" ON storage.objects;
DROP POLICY IF EXISTS "public_read_kids_generated_videos" ON storage.objects;

CREATE POLICY "service_role_all_kids_generated_videos"
    ON storage.objects FOR ALL
    USING (bucket_id = 'kids-generated-videos' AND auth.role() = 'service_role');

CREATE POLICY "public_read_kids_generated_videos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'kids-generated-videos');
