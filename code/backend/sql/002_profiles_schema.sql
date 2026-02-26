-- =====================================================
-- Scrollio Profiles Database Schema
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. PROFILES TABLE
-- Extended user profile information and gamification data
-- Linked to Supabase Auth users
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic Info
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  
  -- Demographics
  age_group TEXT CHECK (age_group IN ('7-12', '13-17', '18-24', '25-34', '35-44', '45+')),
  
  -- Gamification
  level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  
  -- Stats
  total_videos_watched INTEGER DEFAULT 0,
  total_watch_time INTEGER DEFAULT 0, -- Total seconds watched
  total_quizzes_completed INTEGER DEFAULT 0,
  average_quiz_score DECIMAL(5,2) DEFAULT 0,
  
  -- Engagement
  streak_days INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_active_date DATE,
  
  -- Preferences (stored as JSON)
  preferences JSONB DEFAULT '{
    "notifications": true,
    "darkMode": false,
    "autoPlay": true,
    "topicDifficulties": {},
    "preferredTopics": []
  }'::jsonb,
  
  -- Account status
  is_creator BOOLEAN DEFAULT false, -- Can upload content
  is_verified BOOLEAN DEFAULT false,
  is_premium BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON profiles(level DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_xp ON profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_streak ON profiles(streak_days DESC);

-- =====================================================
-- 2. USER FOLLOWS TABLE
-- Track who follows whom
-- =====================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Can't follow yourself
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);

-- =====================================================
-- 3. FUNCTIONS
-- =====================================================

-- Function to auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update profile's updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_profile_updated_at ON profiles;
CREATE TRIGGER trigger_update_profile_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_profile_updated_at();

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION calculate_level(xp_points INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Level formula: level = floor(sqrt(xp / 100)) + 1
  -- Level 1: 0 XP, Level 2: 100 XP, Level 3: 400 XP, Level 4: 900 XP, etc.
  RETURN FLOOR(SQRT(xp_points / 100.0)) + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to add XP and update level
CREATE OR REPLACE FUNCTION add_xp(user_id UUID, xp_amount INTEGER)
RETURNS TABLE(new_xp INTEGER, new_level INTEGER, level_up BOOLEAN) AS $$
DECLARE
  current_xp INTEGER;
  current_level INTEGER;
  updated_xp INTEGER;
  updated_level INTEGER;
BEGIN
  -- Get current XP and level
  SELECT xp, level INTO current_xp, current_level
  FROM profiles WHERE id = user_id;
  
  -- Calculate new XP and level
  updated_xp := current_xp + xp_amount;
  updated_level := calculate_level(updated_xp);
  
  -- Update profile
  UPDATE profiles
  SET xp = updated_xp, level = updated_level
  WHERE id = user_id;
  
  RETURN QUERY SELECT updated_xp, updated_level, (updated_level > current_level);
END;
$$ LANGUAGE plpgsql;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(user_id UUID)
RETURNS TABLE(new_streak INTEGER, streak_maintained BOOLEAN) AS $$
DECLARE
  last_active DATE;
  current_streak INTEGER;
  longest INTEGER;
BEGIN
  SELECT last_active_date, streak_days, longest_streak 
  INTO last_active, current_streak, longest
  FROM profiles WHERE id = user_id;
  
  IF last_active = CURRENT_DATE THEN
    -- Already active today
    RETURN QUERY SELECT current_streak, true;
  ELSIF last_active = CURRENT_DATE - 1 THEN
    -- Continue streak
    current_streak := current_streak + 1;
    IF current_streak > longest THEN
      longest := current_streak;
    END IF;
    
    UPDATE profiles
    SET streak_days = current_streak, 
        longest_streak = longest,
        last_active_date = CURRENT_DATE
    WHERE id = user_id;
    
    RETURN QUERY SELECT current_streak, true;
  ELSE
    -- Streak broken, reset to 1
    UPDATE profiles
    SET streak_days = 1, last_active_date = CURRENT_DATE
    WHERE id = user_id;
    
    RETURN QUERY SELECT 1, false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles (for discovery)
CREATE POLICY "Public can view profiles"
  ON profiles FOR SELECT
  USING (true);

-- Profiles: Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Profiles: Users can only insert their own profile (backup for trigger)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- User Follows: Public can view follows (for follower counts)
CREATE POLICY "Public can view follows"
  ON user_follows FOR SELECT
  USING (true);

-- User Follows: Users can manage their own follows
CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- =====================================================
-- HELPER VIEWS
-- =====================================================

-- View to get profile with follower/following counts
CREATE OR REPLACE VIEW profile_with_counts AS
SELECT 
  p.*,
  (SELECT COUNT(*) FROM user_follows WHERE following_id = p.id) as follower_count,
  (SELECT COUNT(*) FROM user_follows WHERE follower_id = p.id) as following_count
FROM profiles p;

-- =====================================================
-- Done! Run this in your Supabase SQL Editor.
-- 
-- This creates:
-- - profiles table (auto-created on user signup)
-- - user_follows table (for following system)
-- - Functions for XP/level/streak management
-- - RLS policies for security
-- =====================================================

