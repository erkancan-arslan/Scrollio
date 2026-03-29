-- The videos table had a check constraint that didn't include 'expert'.
-- Expand it to allow all three batch difficulty levels.

ALTER TABLE public.videos
  DROP CONSTRAINT IF EXISTS videos_difficulty_level_check;

ALTER TABLE public.videos
  ADD CONSTRAINT videos_difficulty_level_check
  CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
