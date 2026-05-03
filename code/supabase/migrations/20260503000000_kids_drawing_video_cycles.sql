-- Kids 48h drawing-video cycle:
--   Every 48 hours, take the latest kids_drawings row for a child, run an
--   image-to-video pipeline, and pin the result at the top of that child's
--   feed for 24 hours.
--
-- Two tables:
--   * kids_drawing_video_jobs   — async job rows (queued/processing/ready/...)
--   * kids_drawing_video_cycles — per-child cycle state (one row per child)
--
-- A trigger seeds the cycle row whenever a new child profile is created.
-- A backfill ensures every existing child gets a cycle row immediately.

-- ── Jobs table ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.kids_drawing_video_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    drawing_id UUID REFERENCES public.kids_drawings(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'ready', 'failed', 'skipped')),
    current_step TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0
        CHECK (progress_percent >= 0 AND progress_percent <= 100),
    source_image_url TEXT,
    stylized_image_url TEXT,
    video_url TEXT,
    pinned_until TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.kids_drawing_video_jobs IS
    '48h cycle async pipeline: child latest drawing → stylized image → image-to-video → pinned for 24h.';

CREATE INDEX IF NOT EXISTS idx_kids_drawing_video_jobs_child
    ON public.kids_drawing_video_jobs (child_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kids_drawing_video_jobs_pinned
    ON public.kids_drawing_video_jobs (child_profile_id, pinned_until DESC)
    WHERE status = 'ready' AND pinned_until IS NOT NULL;

-- At most one active (queued or processing) job per child.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_kids_drawing_video_jobs_active_per_child
    ON public.kids_drawing_video_jobs (child_profile_id)
    WHERE status IN ('queued', 'processing');

ALTER TABLE public.kids_drawing_video_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_kids_drawing_video_jobs"
    ON public.kids_drawing_video_jobs
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Parents can view own children drawing video jobs"
    ON public.kids_drawing_video_jobs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- ── Cycles table (one row per child) ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.kids_drawing_video_cycles (
    child_profile_id UUID PRIMARY KEY REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    cycle_due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '48 hours'),
    last_generated_at TIMESTAMPTZ,
    last_job_id UUID REFERENCES public.kids_drawing_video_jobs(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.kids_drawing_video_cycles IS
    'Per-child 48h cycle state. cycle_due_at <= now() means the next video is due.';

CREATE INDEX IF NOT EXISTS idx_kids_drawing_video_cycles_due
    ON public.kids_drawing_video_cycles (cycle_due_at);

ALTER TABLE public.kids_drawing_video_cycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_kids_drawing_video_cycles"
    ON public.kids_drawing_video_cycles
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Parents can view own children drawing video cycle"
    ON public.kids_drawing_video_cycles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- ── Auto-seed a cycle row whenever a new child profile is inserted ─────────

CREATE OR REPLACE FUNCTION public.kids_drawing_video_cycles_init()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.kids_drawing_video_cycles (child_profile_id, cycle_due_at)
    VALUES (NEW.id, NEW.created_at + INTERVAL '48 hours')
    ON CONFLICT (child_profile_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kids_drawing_video_cycles_init ON public.kids_child_profiles;
CREATE TRIGGER trg_kids_drawing_video_cycles_init
    AFTER INSERT ON public.kids_child_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.kids_drawing_video_cycles_init();

-- ── Backfill: seed cycle rows for existing children ─────────────────────────

INSERT INTO public.kids_drawing_video_cycles (child_profile_id, cycle_due_at)
SELECT id, created_at + INTERVAL '48 hours'
FROM public.kids_child_profiles
ON CONFLICT (child_profile_id) DO NOTHING;
