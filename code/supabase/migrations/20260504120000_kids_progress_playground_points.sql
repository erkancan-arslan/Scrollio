-- Per-child balance for playground / game rewards (videos, quizzes) — separate from parent auth coins.
ALTER TABLE public.kids_progress
  ADD COLUMN IF NOT EXISTS playground_points integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.kids_progress.playground_points IS
  'Earned by watching kids content and quizzes; spendable in kids games.';
