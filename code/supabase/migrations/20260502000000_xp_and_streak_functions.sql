-- XP and streak RPCs required by the backend (profile.service, feed.service,
-- quiz.service). These functions were previously only defined in the legacy
-- sql/002_profiles_schema.sql reference file and were never applied as a
-- proper migration, which meant every add_xp / update_user_streak RPC call
-- silently failed and XP was never written to the profiles table.

-- ── Helper: derive level from cumulative XP ──────────────────────────────────
-- Formula: level = floor(sqrt(xp / 100)) + 1
-- Level milestones: L1 = 0 XP, L2 = 100, L3 = 400, L4 = 900, L5 = 1600 …
CREATE OR REPLACE FUNCTION calculate_level(xp_points INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN FLOOR(SQRT(xp_points / 100.0)) + 1;
END;
$$;

-- ── Core XP award function ────────────────────────────────────────────────────
-- Called after every watched video and every correct quiz answer.
-- Returns the new XP total, new level, and whether a level-up occurred.
CREATE OR REPLACE FUNCTION add_xp(user_id UUID, xp_amount INTEGER)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, level_up BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  current_xp    INTEGER;
  current_level INTEGER;
  updated_xp    INTEGER;
  updated_level INTEGER;
BEGIN
  SELECT xp, level
  INTO   current_xp, current_level
  FROM   profiles
  WHERE  id = user_id;

  updated_xp    := COALESCE(current_xp, 0) + xp_amount;
  updated_level := calculate_level(updated_xp);

  UPDATE profiles
  SET    xp = updated_xp, level = updated_level
  WHERE  id = user_id;

  RETURN QUERY SELECT updated_xp, updated_level, (updated_level > COALESCE(current_level, 1));
END;
$$;

-- ── Daily streak tracking ─────────────────────────────────────────────────────
-- Increments the streak when the user is active on a new day, resets it
-- if they missed a day, and is idempotent for multiple calls on the same day.
CREATE OR REPLACE FUNCTION update_user_streak(user_id UUID)
RETURNS TABLE(new_streak INTEGER, streak_maintained BOOLEAN)
LANGUAGE plpgsql
AS $$
DECLARE
  last_active    DATE;
  current_streak INTEGER;
  longest        INTEGER;
BEGIN
  SELECT last_active_date, streak_days, longest_streak
  INTO   last_active, current_streak, longest
  FROM   profiles
  WHERE  id = user_id;

  IF last_active = CURRENT_DATE THEN
    -- Already active today — no change
    RETURN QUERY SELECT current_streak, true;

  ELSIF last_active = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Consecutive day — extend streak
    current_streak := COALESCE(current_streak, 0) + 1;
    IF current_streak > COALESCE(longest, 0) THEN
      longest := current_streak;
    END IF;

    UPDATE profiles
    SET    streak_days      = current_streak,
           longest_streak   = longest,
           last_active_date = CURRENT_DATE
    WHERE  id = user_id;

    RETURN QUERY SELECT current_streak, true;

  ELSE
    -- Missed a day (or first activity) — reset to 1
    UPDATE profiles
    SET    streak_days      = 1,
           last_active_date = CURRENT_DATE
    WHERE  id = user_id;

    RETURN QUERY SELECT 1::INTEGER, false;
  END IF;
END;
$$;
