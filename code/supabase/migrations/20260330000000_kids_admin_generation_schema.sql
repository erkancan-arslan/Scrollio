-- Kids admin video generation (multi-mascot): link reference assets and jobs to character slugs,
-- group variant jobs from one admin action, and tie published kids_content rows back to the pipeline.

-- ============================================================
-- 1. reference_videos: which mascot this base clip belongs to
-- ============================================================
ALTER TABLE public.reference_videos
    ADD COLUMN IF NOT EXISTS character_id TEXT;

COMMENT ON COLUMN public.reference_videos.character_id IS
    'For kids animation bases: stable slug matching kids_child_profiles.selected_character_id (e.g. monster_1, monster_2). NULL for core / human reference videos.';

CREATE INDEX IF NOT EXISTS idx_reference_videos_character_id
    ON public.reference_videos (character_id)
    WHERE character_id IS NOT NULL;

-- ============================================================
-- 2. generated_video_jobs: group N mascot-variant jobs from one admin submit
-- ============================================================
ALTER TABLE public.generated_video_jobs
    ADD COLUMN IF NOT EXISTS kids_generation_group_id UUID;

COMMENT ON COLUMN public.generated_video_jobs.kids_generation_group_id IS
    'Shared UUID across jobs created in one kids admin action (one row per mascot). NULL for core jobs and legacy kids rows.';

CREATE INDEX IF NOT EXISTS idx_generated_video_jobs_kids_generation_group_id
    ON public.generated_video_jobs (kids_generation_group_id)
    WHERE kids_generation_group_id IS NOT NULL;

-- ============================================================
-- 3. kids_content: traceability to admin pipeline + same group as variants
-- ============================================================
ALTER TABLE public.kids_content
    ADD COLUMN IF NOT EXISTS source_generated_video_id UUID REFERENCES public.generated_videos(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS kids_generation_group_id UUID;

COMMENT ON COLUMN public.kids_content.source_generated_video_id IS
    'When this row was published from admin generation, the generated_videos row that produced it.';

COMMENT ON COLUMN public.kids_content.kids_generation_group_id IS
    'Same UUID as generated_video_jobs.kids_generation_group_id for sibling mascot variants of one lesson.';

CREATE INDEX IF NOT EXISTS idx_kids_content_source_generated_video_id
    ON public.kids_content (source_generated_video_id)
    WHERE source_generated_video_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_kids_content_kids_generation_group_id
    ON public.kids_content (kids_generation_group_id)
    WHERE kids_generation_group_id IS NOT NULL;

-- Feed filtering by mascot (character_id already exists on kids_content from kids_character_selection)
CREATE INDEX IF NOT EXISTS idx_kids_content_character_id_active
    ON public.kids_content (character_id)
    WHERE is_active = true AND character_id IS NOT NULL;
