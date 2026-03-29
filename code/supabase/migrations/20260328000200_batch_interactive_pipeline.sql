-- Interactive batch pipeline: topic suggestion → script review → per-job video generation

-- ============================================================
-- 1. Expand generation_batches.status to include pending_scripts
-- ============================================================
ALTER TABLE public.generation_batches
  DROP CONSTRAINT IF EXISTS generation_batches_status_check;

ALTER TABLE public.generation_batches
  ADD CONSTRAINT generation_batches_status_check
  CHECK (status IN ('pending', 'pending_scripts', 'running', 'completed', 'failed'));

-- ============================================================
-- 2. Add suggested_sub_topic column to generated_video_jobs
--    Stores the LLM-suggested specific topic before user approval
-- ============================================================
ALTER TABLE public.generated_video_jobs
  ADD COLUMN IF NOT EXISTS suggested_sub_topic TEXT;

-- ============================================================
-- 3. Add script_approved flag so individual scripts can be
--    approved independently to trigger per-job video generation
-- ============================================================
ALTER TABLE public.generated_video_jobs
  ADD COLUMN IF NOT EXISTS script_approved BOOLEAN NOT NULL DEFAULT false;
