-- Per-player question indices for simultaneous (async) play mode.
-- Each player advances their own question stream independently;
-- the old shared current_question_index is kept for compatibility but no longer driven.
ALTER TABLE duel_matches
  ADD COLUMN IF NOT EXISTS question_index_a INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS question_index_b INTEGER NOT NULL DEFAULT 0;
