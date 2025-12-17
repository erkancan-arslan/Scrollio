-- =====================================================
-- Scrollio Feed Database Schema
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. TOPICS TABLE
-- Educational topics/categories for content organization
-- =====================================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  category TEXT CHECK (category IN ('science', 'technology', 'finance', 'arts', 'history', 'languages', 'health', 'other')),
  color TEXT, -- Hex color for UI
  video_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active topics
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);

-- =====================================================
-- 2. CREATORS TABLE
-- Content creators (AI or human experts)
-- =====================================================
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for AI creators
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  is_verified BOOLEAN DEFAULT false,
  is_ai BOOLEAN DEFAULT false, -- True for AI-generated narrator characters
  follower_count INTEGER DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creators_username ON creators(username);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON creators(user_id);

-- =====================================================
-- 3. VIDEOS TABLE
-- Educational video content with BunnyCDN URLs
-- =====================================================
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  
  -- BunnyCDN URLs
  video_url TEXT NOT NULL, -- BunnyCDN video URL
  thumbnail_url TEXT, -- BunnyCDN thumbnail URL
  
  -- Video metadata
  duration INTEGER NOT NULL, -- Duration in seconds
  width INTEGER,
  height INTEGER,
  
  -- Relationships
  topic_id UUID REFERENCES topics(id) ON DELETE SET NULL,
  creator_id UUID REFERENCES creators(id) ON DELETE SET NULL,
  
  -- Categorization
  difficulty_level TEXT CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
  tags TEXT[] DEFAULT '{}',
  
  -- Stats (denormalized for performance)
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  bookmark_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  moderation_status TEXT CHECK (moderation_status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_videos_topic ON videos(topic_id);
CREATE INDEX IF NOT EXISTS idx_videos_creator ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_published ON videos(is_published, moderation_status) WHERE is_published = true AND moderation_status = 'approved';
CREATE INDEX IF NOT EXISTS idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_view_count ON videos(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_videos_like_count ON videos(like_count DESC);

-- =====================================================
-- 4. VIDEO LIKES TABLE
-- Track user likes on videos
-- =====================================================
CREATE TABLE IF NOT EXISTS video_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_video_likes_user ON video_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_video_likes_video ON video_likes(video_id);

-- =====================================================
-- 5. VIDEO BOOKMARKS TABLE
-- Track user bookmarks on videos
-- =====================================================
CREATE TABLE IF NOT EXISTS video_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_video_bookmarks_user ON video_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_video_bookmarks_video ON video_bookmarks(video_id);

-- =====================================================
-- 6. VIDEO VIEWS TABLE
-- Track video views and watch time
-- =====================================================
CREATE TABLE IF NOT EXISTS video_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for anonymous views
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watch_duration INTEGER DEFAULT 0, -- Seconds watched
  completed BOOLEAN DEFAULT false, -- Did user watch >80%
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_views_user ON video_views(user_id);
CREATE INDEX IF NOT EXISTS idx_video_views_video ON video_views(video_id);
CREATE INDEX IF NOT EXISTS idx_video_views_created_at ON video_views(created_at DESC);

-- =====================================================
-- 7. USER TOPIC INTERESTS TABLE
-- Track which topics a user is interested in
-- =====================================================
CREATE TABLE IF NOT EXISTS user_topic_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  interest_score DECIMAL(5,2) DEFAULT 1.0, -- Higher = more interest
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_user_topic_interests_user ON user_topic_interests(user_id);

-- =====================================================
-- TRIGGERS: Auto-update counts
-- =====================================================

-- Update video like count
CREATE OR REPLACE FUNCTION update_video_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE videos SET like_count = like_count + 1, updated_at = NOW() WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE videos SET like_count = GREATEST(like_count - 1, 0), updated_at = NOW() WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_video_like_count ON video_likes;
CREATE TRIGGER trigger_update_video_like_count
AFTER INSERT OR DELETE ON video_likes
FOR EACH ROW EXECUTE FUNCTION update_video_like_count();

-- Update video bookmark count
CREATE OR REPLACE FUNCTION update_video_bookmark_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE videos SET bookmark_count = bookmark_count + 1, updated_at = NOW() WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE videos SET bookmark_count = GREATEST(bookmark_count - 1, 0), updated_at = NOW() WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_video_bookmark_count ON video_bookmarks;
CREATE TRIGGER trigger_update_video_bookmark_count
AFTER INSERT OR DELETE ON video_bookmarks
FOR EACH ROW EXECUTE FUNCTION update_video_bookmark_count();

-- Update video view count
CREATE OR REPLACE FUNCTION update_video_view_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE videos SET view_count = view_count + 1, updated_at = NOW() WHERE id = NEW.video_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_video_view_count ON video_views;
CREATE TRIGGER trigger_update_video_view_count
AFTER INSERT ON video_views
FOR EACH ROW EXECUTE FUNCTION update_video_view_count();

-- Update topic video count
CREATE OR REPLACE FUNCTION update_topic_video_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_published = true THEN
    UPDATE topics SET video_count = video_count + 1, updated_at = NOW() WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_published = true THEN
    UPDATE topics SET video_count = GREATEST(video_count - 1, 0), updated_at = NOW() WHERE id = OLD.topic_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle publish/unpublish
    IF OLD.is_published = false AND NEW.is_published = true THEN
      UPDATE topics SET video_count = video_count + 1, updated_at = NOW() WHERE id = NEW.topic_id;
    ELSIF OLD.is_published = true AND NEW.is_published = false THEN
      UPDATE topics SET video_count = GREATEST(video_count - 1, 0), updated_at = NOW() WHERE id = OLD.topic_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_topic_video_count ON videos;
CREATE TRIGGER trigger_update_topic_video_count
AFTER INSERT OR UPDATE OR DELETE ON videos
FOR EACH ROW EXECUTE FUNCTION update_topic_video_count();

-- Update creator video count
CREATE OR REPLACE FUNCTION update_creator_video_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.is_published = true THEN
    UPDATE creators SET video_count = video_count + 1, updated_at = NOW() WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' AND OLD.is_published = true THEN
    UPDATE creators SET video_count = GREATEST(video_count - 1, 0), updated_at = NOW() WHERE id = OLD.creator_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.is_published = false AND NEW.is_published = true THEN
      UPDATE creators SET video_count = video_count + 1, updated_at = NOW() WHERE id = NEW.creator_id;
    ELSIF OLD.is_published = true AND NEW.is_published = false THEN
      UPDATE creators SET video_count = GREATEST(video_count - 1, 0), updated_at = NOW() WHERE id = OLD.creator_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_creator_video_count ON videos;
CREATE TRIGGER trigger_update_creator_video_count
AFTER INSERT OR UPDATE OR DELETE ON videos
FOR EACH ROW EXECUTE FUNCTION update_creator_video_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_topic_interests ENABLE ROW LEVEL SECURITY;

-- Topics: Public read access
CREATE POLICY "Public can view active topics"
  ON topics FOR SELECT
  USING (is_active = true);

-- Creators: Public read access
CREATE POLICY "Public can view creators"
  ON creators FOR SELECT
  USING (true);

-- Videos: Public read access for published & approved videos
CREATE POLICY "Public can view published videos"
  ON videos FOR SELECT
  USING (is_published = true AND moderation_status = 'approved');

-- Video Likes: Users can manage their own likes
CREATE POLICY "Users can view own likes"
  ON video_likes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own likes"
  ON video_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON video_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Video Bookmarks: Users can manage their own bookmarks
CREATE POLICY "Users can view own bookmarks"
  ON video_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks"
  ON video_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
  ON video_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Video Views: Users can insert views, view own history
CREATE POLICY "Users can view own watch history"
  ON video_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert views"
  ON video_views FOR INSERT
  WITH CHECK (true);

-- User Topic Interests: Users can manage their own interests
CREATE POLICY "Users can view own interests"
  ON user_topic_interests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own interests"
  ON user_topic_interests FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- SEED DATA: Sample Topics
-- =====================================================
INSERT INTO topics (name, slug, description, category, color, is_active) VALUES
  ('Science', 'science', 'Explore the wonders of the natural world', 'science', '#4CAF50', true),
  ('Technology', 'technology', 'Latest in tech, coding, and innovation', 'technology', '#2196F3', true),
  ('Finance', 'finance', 'Personal finance, investing, and economics', 'finance', '#FF9800', true),
  ('History', 'history', 'Journey through time and civilizations', 'history', '#795548', true),
  ('Psychology', 'psychology', 'Understanding the human mind', 'health', '#9C27B0', true),
  ('Mathematics', 'mathematics', 'Numbers, patterns, and problem solving', 'science', '#F44336', true),
  ('Languages', 'languages', 'Learn new languages and linguistics', 'languages', '#00BCD4', true),
  ('Art & Design', 'art-design', 'Creativity, aesthetics, and visual arts', 'arts', '#E91E63', true),
  ('Physics', 'physics', 'Understanding the laws of the universe', 'science', '#673AB7', true),
  ('Biology', 'biology', 'Life sciences and living organisms', 'science', '#8BC34A', true)
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- SEED DATA: Sample Creators
-- =====================================================
INSERT INTO creators (username, display_name, avatar_url, bio, is_verified, is_ai) VALUES
  ('sciencewithsara', 'Sara Science', 'https://i.pravatar.cc/150?u=sara', 'Making science fun and accessible!', true, true),
  ('astromax', 'Max Astronomy', 'https://i.pravatar.cc/150?u=max', 'Your guide to the cosmos 🌌', true, true),
  ('moneyminute', 'Finance in a Minute', 'https://i.pravatar.cc/150?u=finance', 'Financial literacy for everyone 💰', true, true),
  ('codewithjane', 'Jane Codes', 'https://i.pravatar.cc/150?u=jane', 'Software engineer & educator 💻', false, false),
  ('historyflash', 'History Flash', 'https://i.pravatar.cc/150?u=history', 'History in 60 seconds ⚔️', true, true),
  ('curiositydaily', 'Curiosity Daily', 'https://i.pravatar.cc/150?u=curious', 'Feeding your curiosity every day', true, true),
  ('mathmagic', 'Math Magic', 'https://i.pravatar.cc/150?u=math', 'Making math magical ✨', true, true),
  ('psych101', 'Psychology 101', 'https://i.pravatar.cc/150?u=psych', 'Understanding minds, one video at a time', true, true)
ON CONFLICT (username) DO NOTHING;

-- =====================================================
-- SEED DATA: Sample Videos (BunnyCDN URLs - replace with your actual URLs)
-- =====================================================

-- Get creator and topic IDs for sample videos
DO $$
DECLARE
  science_topic_id UUID;
  tech_topic_id UUID;
  finance_topic_id UUID;
  history_topic_id UUID;
  psychology_topic_id UUID;
  physics_topic_id UUID;
  biology_topic_id UUID;
  
  sara_creator_id UUID;
  max_creator_id UUID;
  finance_creator_id UUID;
  jane_creator_id UUID;
  history_creator_id UUID;
  curiosity_creator_id UUID;
  math_creator_id UUID;
  psych_creator_id UUID;
BEGIN
  -- Get topic IDs
  SELECT id INTO science_topic_id FROM topics WHERE slug = 'science';
  SELECT id INTO tech_topic_id FROM topics WHERE slug = 'technology';
  SELECT id INTO finance_topic_id FROM topics WHERE slug = 'finance';
  SELECT id INTO history_topic_id FROM topics WHERE slug = 'history';
  SELECT id INTO psychology_topic_id FROM topics WHERE slug = 'psychology';
  SELECT id INTO physics_topic_id FROM topics WHERE slug = 'physics';
  SELECT id INTO biology_topic_id FROM topics WHERE slug = 'biology';
  
  -- Get creator IDs
  SELECT id INTO sara_creator_id FROM creators WHERE username = 'sciencewithsara';
  SELECT id INTO max_creator_id FROM creators WHERE username = 'astromax';
  SELECT id INTO finance_creator_id FROM creators WHERE username = 'moneyminute';
  SELECT id INTO jane_creator_id FROM creators WHERE username = 'codewithjane';
  SELECT id INTO history_creator_id FROM creators WHERE username = 'historyflash';
  SELECT id INTO curiosity_creator_id FROM creators WHERE username = 'curiositydaily';
  SELECT id INTO math_creator_id FROM creators WHERE username = 'mathmagic';
  SELECT id INTO psych_creator_id FROM creators WHERE username = 'psych101';

  -- Insert sample videos
  -- NOTE: Replace BUNNY_CDN_PULLZONE with your actual BunnyCDN pull zone URL
  -- Example: https://scrollio.b-cdn.net
  
  INSERT INTO videos (title, description, video_url, thumbnail_url, duration, topic_id, creator_id, difficulty_level, tags, is_published, moderation_status, published_at) VALUES
  (
    'Why do we dream?',
    'Exploring the fascinating science behind dreams and what happens in our brain while we sleep. #science #psychology #dreams',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/sample-videos/dreams.mp4',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/thumbnails/dreams.jpg',
    45,
    psychology_topic_id,
    sara_creator_id,
    'beginner',
    ARRAY['science', 'psychology', 'dreams', 'sleep'],
    true,
    'approved',
    NOW()
  ),
  (
    'How black holes form',
    'A quick explanation of how massive stars collapse to form black holes - the most mysterious objects in the universe! ✨🌌',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/sample-videos/blackholes.mp4',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/thumbnails/blackholes.jpg',
    58,
    physics_topic_id,
    max_creator_id,
    'intermediate',
    ARRAY['space', 'astronomy', 'blackholes', 'physics'],
    true,
    'approved',
    NOW() - INTERVAL '1 day'
  ),
  (
    'The power of compound interest',
    'Learn how compound interest can turn small savings into big wealth over time. Start early! 💰📈 #finance #investing',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/sample-videos/compound-interest.mp4',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/thumbnails/compound-interest.jpg',
    42,
    finance_topic_id,
    finance_creator_id,
    'beginner',
    ARRAY['finance', 'investing', 'money', 'savings'],
    true,
    'approved',
    NOW() - INTERVAL '2 days'
  ),
  (
    'JavaScript closures explained',
    'Understanding closures is key to mastering JavaScript. Here''s the simplest explanation! 💻🚀 #coding #javascript #webdev',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/sample-videos/js-closures.mp4',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/thumbnails/js-closures.jpg',
    55,
    tech_topic_id,
    jane_creator_id,
    'intermediate',
    ARRAY['coding', 'javascript', 'programming', 'webdev'],
    true,
    'approved',
    NOW() - INTERVAL '3 days'
  ),
  (
    'Why do we yawn?',
    'Is yawning really contagious? The science behind this everyday phenomenon might surprise you! 🥱🧠',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/sample-videos/yawning.mp4',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/thumbnails/yawning.jpg',
    38,
    biology_topic_id,
    curiosity_creator_id,
    'beginner',
    ARRAY['biology', 'science', 'health', 'curiosity'],
    true,
    'approved',
    NOW() - INTERVAL '4 days'
  ),
  (
    'Ancient Rome in 60 seconds',
    'From a small village to the greatest empire - the rise and fall of Rome condensed! 🏛️⚔️ #history #rome #ancient',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/sample-videos/ancient-rome.mp4',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/thumbnails/ancient-rome.jpg',
    60,
    history_topic_id,
    history_creator_id,
    'beginner',
    ARRAY['history', 'rome', 'ancient', 'civilization'],
    true,
    'approved',
    NOW() - INTERVAL '5 days'
  ),
  (
    'Quantum entanglement simplified',
    'Einstein called it "spooky action at a distance" - here''s what quantum entanglement really means! ⚛️🔮',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/sample-videos/quantum.mp4',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/thumbnails/quantum.jpg',
    48,
    physics_topic_id,
    max_creator_id,
    'advanced',
    ARRAY['physics', 'quantum', 'science', 'einstein'],
    true,
    'approved',
    NOW() - INTERVAL '6 days'
  ),
  (
    'The 50/30/20 Budget Rule',
    'The simplest budgeting method that actually works. 50% needs, 30% wants, 20% savings. Here''s how! 💵',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/sample-videos/budget-rule.mp4',
    'https://vz-8e7d5c4a-0c4.b-cdn.net/thumbnails/budget-rule.jpg',
    52,
    finance_topic_id,
    finance_creator_id,
    'beginner',
    ARRAY['finance', 'budgeting', 'money', 'personal-finance'],
    true,
    'approved',
    NOW() - INTERVAL '7 days'
  )
  ON CONFLICT DO NOTHING;

END $$;

-- =====================================================
-- Done! Your feed database is ready.
-- Run this entire SQL in your Supabase SQL Editor.
-- 
-- After running:
-- 1. Set BUNNY_CDN_URL in your backend .env file
-- 2. Replace sample video URLs with your actual BunnyCDN URLs
-- =====================================================

