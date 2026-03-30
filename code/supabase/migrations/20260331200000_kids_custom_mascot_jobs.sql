-- Parent-created custom mascot: 2D drawing → pipeline → final merged video per child.

CREATE TABLE IF NOT EXISTS public.kids_custom_mascot_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    parent_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'ready', 'failed')),
    current_step TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
    mentor_image_url TEXT,
    portrait_9_16_image_url TEXT,
    raw_video_url TEXT,
    final_video_url TEXT,
    narration_audio_url TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.kids_custom_mascot_jobs IS
    'Async pipeline: child drawing → 3D-style image → 9:16 frame → i2v → merge with bundled narration audio.';

CREATE INDEX IF NOT EXISTS idx_kids_custom_mascot_jobs_child
    ON public.kids_custom_mascot_jobs (child_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kids_custom_mascot_jobs_parent
    ON public.kids_custom_mascot_jobs (parent_user_id);

ALTER TABLE public.kids_custom_mascot_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_kids_custom_mascot_jobs"
    ON public.kids_custom_mascot_jobs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
