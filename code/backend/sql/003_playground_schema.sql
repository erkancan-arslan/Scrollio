-- =====================================================
-- Scrollio Playground Schema
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. ENUMS & TYPES
-- =====================================================

-- Game types supported in the playground
CREATE TYPE game_type AS ENUM (
  'infinite_flow',
  'timeline_master',
  'math_snake',
  'zoom_focus',
  'perfect_eye',
  'tic_tac_toe',
  'four_in_a_row',
  'rock_paper_scissors',
  'word_guess',
  'memory_match',
  'number_duel',
  'battleship',
  'tiny_geoguess',
  'turkish_wordle'
);

-- =====================================================
-- 2. GAME SESSIONS
-- Tracks individual game sessions for analytics & verification
-- =====================================================
CREATE TABLE IF NOT EXISTS game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  
  -- Session Data
  score INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb, -- Store game-specific details (e.g. max streak, moves)
  
  -- Timing
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  
  -- Validation
  is_verified BOOLEAN DEFAULT false, -- Set to true if server-side validation passes
  
  -- Constraints
  CONSTRAINT check_positive_score CHECK (score >= 0)
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_type ON game_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_game_sessions_created ON game_sessions(started_at DESC);

-- =====================================================
-- 3. GAME SCORES (High Scores & Stats)
-- Aggregated stats per user per game
-- =====================================================
CREATE TABLE IF NOT EXISTS game_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  
  -- Stats
  best_score INTEGER DEFAULT 0,
  total_games_played INTEGER DEFAULT 0,
  total_time_played_seconds INTEGER DEFAULT 0,
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, game_type)
);

CREATE INDEX IF NOT EXISTS idx_game_scores_user ON game_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_leaderboard ON game_scores(game_type, best_score DESC);

-- =====================================================
-- 4. SCROLLIO COINS LEDGER
-- Tracks virtual currency transactions
-- =====================================================
CREATE TABLE IF NOT EXISTS scrollio_coins_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  amount INTEGER NOT NULL, -- Positive for earning, negative for spending/wagering
  transaction_type TEXT NOT NULL, -- 'game_reward', 'challenge_wager', 'challenge_win', 'daily_bonus'
  reference_id UUID, -- Link to game_session OR challenge_id
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coins_user ON scrollio_coins_ledger(user_id);

-- =====================================================
-- 5. CHALLENGES (WAGER SYSTEM)
-- Asynchronous challenges between users
-- =====================================================
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type game_type NOT NULL,
  
  -- Challenge Config
  wager_amount INTEGER NOT NULL DEFAULT 0,
  target_score INTEGER NOT NULL, -- The score to beat (creator's score)
  game_config JSONB NOT NULL, -- Seed, questions list, etc. for determinism
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT check_positive_wager CHECK (wager_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_challenges_creator ON challenges(creator_id);
CREATE INDEX IF NOT EXISTS idx_challenges_status ON challenges(status);

-- =====================================================
-- 6. CHALLENGE ATTEMPTS
-- Tracks attempts by other users to beat the challenge
-- =====================================================
CREATE TABLE IF NOT EXISTS challenge_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  challenger_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  score INTEGER NOT NULL,
  is_win BOOLEAN DEFAULT false,
  claimed_at TIMESTAMPTZ, -- When the reward was claimed
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(challenge_id, challenger_id) -- One attempt per user per challenge
);

CREATE INDEX IF NOT EXISTS idx_challenge_attempts_user ON challenge_attempts(challenger_id);
CREATE INDEX IF NOT EXISTS idx_challenge_attempts_challenge ON challenge_attempts(challenge_id);

-- =====================================================
-- 7. RLS POLICIES
-- =====================================================

ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrollio_coins_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_attempts ENABLE ROW LEVEL SECURITY;

-- Game Sessions
CREATE POLICY "Users can insert own sessions" ON game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own sessions" ON game_sessions FOR SELECT USING (auth.uid() = user_id);

-- Game Scores
CREATE POLICY "Public can view high scores" ON game_scores FOR SELECT USING (true);
CREATE POLICY "Users can update own scores" ON game_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON game_scores FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Coins Ledger
CREATE POLICY "Users can view own transactions" ON scrollio_coins_ledger FOR SELECT USING (auth.uid() = user_id);
-- No insert policy for clients; ledger should be managed by server-side functions/triggers mostly, but for MVP client might need to insert (secured via RLS check)
CREATE POLICY "Users can insert ledger entries" ON scrollio_coins_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Challenges
CREATE POLICY "Public can view active challenges" ON challenges FOR SELECT USING (true);
CREATE POLICY "Users can create challenges" ON challenges FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update challenges" ON challenges FOR UPDATE USING (auth.uid() = creator_id);

-- Challenge Attempts
CREATE POLICY "Public can view attempts" ON challenge_attempts FOR SELECT USING (true);
CREATE POLICY "Users can create attempts" ON challenge_attempts FOR INSERT WITH CHECK (auth.uid() = challenger_id);

-- =====================================================
-- 8. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update game_scores after a session
CREATE OR REPLACE FUNCTION update_game_score_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or Update the aggregate score row
  INSERT INTO game_scores (user_id, game_type, best_score, total_games_played, total_time_played_seconds, last_played_at)
  VALUES (
    NEW.user_id,
    NEW.game_type,
    NEW.score,
    1,
    COALESCE(NEW.duration_seconds, 0),
    NOW()
  )
  ON CONFLICT (user_id, game_type)
  DO UPDATE SET
    best_score = GREATEST(game_scores.best_score, EXCLUDED.best_score),
    total_games_played = game_scores.total_games_played + 1,
    total_time_played_seconds = game_scores.total_time_played_seconds + EXCLUDED.total_time_played_seconds,
    last_played_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_game_scores
  AFTER INSERT ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_game_score_stats();

-- Function to calculate total coins
CREATE OR REPLACE FUNCTION get_user_coins(target_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total
  FROM scrollio_coins_ledger
  WHERE user_id = target_user_id;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
