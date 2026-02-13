-- =====================================================
-- Scrollio Duel Jokers Schema Extension
-- Adds joker state columns to duel_matches
-- and extends duel_events type constraint.
-- =====================================================

-- 1. Add joker columns to duel_matches (idempotent)
ALTER TABLE duel_matches
  ADD COLUMN IF NOT EXISTS joker_config JSONB NOT NULL
    DEFAULT '{"allowedJokers":["SHIELD","FREEZE","CLEANSE"],"usesPerJoker":1}'::jsonb,
  ADD COLUMN IF NOT EXISTS player_a_jokers JSONB NOT NULL
    DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS player_b_jokers JSONB NOT NULL
    DEFAULT '{}'::jsonb;

-- 2. Extend duel_events type constraint to include 'joker_used'
ALTER TABLE duel_events DROP CONSTRAINT IF EXISTS duel_events_type_check;
ALTER TABLE duel_events ADD CONSTRAINT duel_events_type_check
  CHECK (type IN ('answer', 'timeout', 'tick', 'match_start', 'match_end', 'joker_used'));
