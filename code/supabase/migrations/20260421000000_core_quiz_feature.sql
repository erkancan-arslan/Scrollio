-- Core Quiz Feature
-- Adds per-topic, per-level quizzes for Scrollio Core (non-kids).
--
-- Design (see plan): after a user has watched every video at their current
-- level in a topic, the mobile app surfaces a multiple-choice quiz whose
-- questions come from the AI-generated quiz_questions attached to each video.
-- A correct answer inserts a row into user_topic_level_unlocks which the
-- feed personalizer uses to unlock the next difficulty tier for that topic.
-- Every attempt (correct or not) is logged to core_quiz_attempts so the
-- question picker can exclude already-seen questions.

-- 1. Quiz questions JSONB on the two video tables --------------------------

ALTER TABLE public.videos
  ADD COLUMN IF NOT EXISTS quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.generated_videos
  ADD COLUMN IF NOT EXISTS quiz_questions JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Per-user level unlock table -------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_topic_level_unlocks (
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic       TEXT NOT NULL,
  level       TEXT NOT NULL CHECK (level IN ('intermediate','advanced')),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, topic, level)
);

CREATE INDEX IF NOT EXISTS idx_user_topic_unlocks_user
  ON public.user_topic_level_unlocks (user_id);

ALTER TABLE public.user_topic_level_unlocks ENABLE ROW LEVEL SECURITY;

-- Users can read their own unlocks
DROP POLICY IF EXISTS "Users read own topic unlocks"
  ON public.user_topic_level_unlocks;
CREATE POLICY "Users read own topic unlocks"
  ON public.user_topic_level_unlocks FOR SELECT
  USING (auth.uid() = user_id);

-- Writes happen via service role from the backend; no insert/update policy
-- for end-users here on purpose (quiz submission goes through the API).

-- 3. Attempt log -----------------------------------------------------------
-- Used both for analytics and to exclude already-attempted questions so the
-- user isn't asked the same MC item twice.

CREATE TABLE IF NOT EXISTS public.core_quiz_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic           TEXT NOT NULL,
  level           TEXT NOT NULL CHECK (level IN ('beginner','intermediate')),
  video_id        UUID REFERENCES public.videos(id) ON DELETE SET NULL,
  question_id     TEXT NOT NULL,
  selected_answer INT  NOT NULL,
  is_correct      BOOLEAN NOT NULL,
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_core_quiz_attempts_user_topic_level
  ON public.core_quiz_attempts (user_id, topic, level);

CREATE INDEX IF NOT EXISTS idx_core_quiz_attempts_question
  ON public.core_quiz_attempts (user_id, question_id);

ALTER TABLE public.core_quiz_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own quiz attempts"
  ON public.core_quiz_attempts;
CREATE POLICY "Users read own quiz attempts"
  ON public.core_quiz_attempts FOR SELECT
  USING (auth.uid() = user_id);
-- INSERT goes through the backend using the service role.
