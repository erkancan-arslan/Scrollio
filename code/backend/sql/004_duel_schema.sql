-- =====================================================
-- Scrollio Duel Schema
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ENUMS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE duel_request_status AS ENUM (
        'pending',
        'accepted',
        'rejected',
        'expired',
        'canceled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE duel_match_state AS ENUM (
        'waiting',
        'active',
        'finished',
        'canceled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 2. DUEL REQUESTS
-- =====================================================
CREATE TABLE IF NOT EXISTS duel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  status duel_request_status NOT NULL DEFAULT 'pending',

  match_id UUID, -- FK added after duel_matches table is created

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 seconds'),

  CONSTRAINT check_not_self_duel CHECK (from_user_id != to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_duel_requests_from ON duel_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_duel_requests_to ON duel_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_duel_requests_status ON duel_requests(status);
CREATE INDEX IF NOT EXISTS idx_duel_requests_expires ON duel_requests(expires_at)
  WHERE status = 'pending';

-- =====================================================
-- 3. DUEL MATCHES
-- =====================================================
CREATE TABLE IF NOT EXISTS duel_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_b_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  state duel_match_state NOT NULL DEFAULT 'waiting',

  -- Deterministic question config
  seed INTEGER NOT NULL,
  question_set_id TEXT NOT NULL,       -- e.g. 'infinite_flow_en_v1'
  bank_version TEXT NOT NULL,          -- content hash for validation

  -- Server-authoritative timing
  start_time TIMESTAMPTZ,
  remaining_ms_a INTEGER NOT NULL DEFAULT 30000,
  remaining_ms_b INTEGER NOT NULL DEFAULT 30000,

  -- Question progression
  current_question_index INTEGER NOT NULL DEFAULT 0,
  player_a_answered BOOLEAN NOT NULL DEFAULT false,
  player_b_answered BOOLEAN NOT NULL DEFAULT false,

  -- Server tick tracking
  last_tick_at TIMESTAMPTZ DEFAULT NOW(),

  -- Result
  winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  finish_reason TEXT, -- 'timeout_a', 'timeout_b', 'questions_exhausted', 'disconnect', 'canceled'

  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT check_different_players CHECK (player_a_id != player_b_id),
  CONSTRAINT check_positive_remaining_a CHECK (remaining_ms_a >= -1000), -- small negative allowed for grace
  CONSTRAINT check_positive_remaining_b CHECK (remaining_ms_b >= -1000)
);

CREATE INDEX IF NOT EXISTS idx_duel_matches_player_a ON duel_matches(player_a_id);
CREATE INDEX IF NOT EXISTS idx_duel_matches_player_b ON duel_matches(player_b_id);
CREATE INDEX IF NOT EXISTS idx_duel_matches_state ON duel_matches(state);
CREATE INDEX IF NOT EXISTS idx_duel_matches_active ON duel_matches(state)
  WHERE state = 'active';

-- Add FK from duel_requests to duel_matches (idempotent check)
DO $$ BEGIN
  ALTER TABLE duel_requests
    ADD CONSTRAINT fk_duel_requests_match
    FOREIGN KEY (match_id) REFERENCES duel_matches(id) ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- 4. DUEL EVENTS (Audit Log)
-- =====================================================
CREATE TABLE IF NOT EXISTS duel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES duel_matches(id) ON DELETE CASCADE,
  seq SERIAL,
  server_time TIMESTAMPTZ DEFAULT NOW(),

  type TEXT NOT NULL CHECK (type IN ('answer', 'timeout', 'tick', 'match_start', 'match_end')),

  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- payload examples:
  --   answer:      { "player_id": "...", "question_index": 0, "is_correct": true, "delta_self_ms": 1000, "delta_other_ms": -1000 }
  --   timeout:     { "player_id": "...", "remaining_ms": 0 }
  --   match_start: { "seed": 12345, "question_set_id": "...", "bank_version": "..." }
  --   match_end:   { "winner_id": "...", "finish_reason": "timeout_a", "final_ms_a": 0, "final_ms_b": 12345 }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_duel_events_match ON duel_events(match_id);
CREATE INDEX IF NOT EXISTS idx_duel_events_match_seq ON duel_events(match_id, seq);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE duel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE duel_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to ensure clean state
DROP POLICY IF EXISTS "Users can view own duel requests" ON duel_requests;
DROP POLICY IF EXISTS "Users can create duel requests" ON duel_requests;
DROP POLICY IF EXISTS "Users can update own duel requests" ON duel_requests;

DROP POLICY IF EXISTS "Participants can view duel matches" ON duel_matches;
DROP POLICY IF EXISTS "Service role can manage duel matches" ON duel_matches;

DROP POLICY IF EXISTS "Participants can view duel events" ON duel_events;

-- Duel Requests policies
CREATE POLICY "Users can view own duel requests"
  ON duel_requests FOR SELECT
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create duel requests"
  ON duel_requests FOR INSERT
  WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update own duel requests"
  ON duel_requests FOR UPDATE
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Duel Matches policies
CREATE POLICY "Participants can view duel matches"
  ON duel_matches FOR SELECT
  USING (auth.uid() = player_a_id OR auth.uid() = player_b_id);

CREATE POLICY "Service role can manage duel matches"
  ON duel_matches FOR ALL
  USING (true)
  WITH CHECK (true);

-- Duel Events policies
CREATE POLICY "Participants can view duel events"
  ON duel_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM duel_matches m
      WHERE m.id = duel_events.match_id
        AND (auth.uid() = m.player_a_id OR auth.uid() = m.player_b_id)
    )
  );

-- =====================================================
-- 6. AUTO-EXPIRE PENDING REQUESTS (Function)
-- =====================================================
CREATE OR REPLACE FUNCTION expire_duel_requests()
RETURNS void AS $$
BEGIN
  UPDATE duel_requests
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. ENABLE REALTIME FOR duel_requests
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND schemaname = 'public'
    AND tablename = 'duel_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE duel_requests;
  END IF;
END $$;
