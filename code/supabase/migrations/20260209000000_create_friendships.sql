-- =====================================================
-- FRIENDSHIPS SYSTEM
-- =====================================================
-- This migration creates the friendship system for Scrollio
-- allowing users to search for other users and add them as friends

-- =====================================================
-- 1. FRIENDSHIPS TABLE
-- =====================================================
-- Purpose: Manage friend relationships and requests between users

CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT no_self_friendship CHECK (user_id != friend_id),
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Indexes for performance
CREATE INDEX idx_friendships_user_id ON friendships(user_id);
CREATE INDEX idx_friendships_friend_id ON friendships(friend_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_friendships_user_status ON friendships(user_id, status);

-- =====================================================
-- 2. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships where they are involved
CREATE POLICY "Users can view own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- Users can send friend requests (insert)
CREATE POLICY "Users can send friend requests"
  ON friendships FOR INSERT
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Users can update friendships where they are the recipient
CREATE POLICY "Users can respond to friend requests"
  ON friendships FOR UPDATE
  USING (auth.uid() = friend_id)
  WITH CHECK (auth.uid() = friend_id);

-- Users can delete friendships where they are involved (unfriend/cancel request)
CREATE POLICY "Users can delete own friendships"
  ON friendships FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- =====================================================
-- 3. HELPER FUNCTIONS
-- =====================================================

-- Function to get friendship status between two users
CREATE OR REPLACE FUNCTION get_friendship_status(
  requesting_user_id UUID,
  target_user_id UUID
)
RETURNS TEXT AS $$
DECLARE
  friend_status TEXT;
BEGIN
  -- Check if there's a friendship in either direction
  SELECT status INTO friend_status
  FROM friendships
  WHERE (user_id = requesting_user_id AND friend_id = target_user_id)
     OR (user_id = target_user_id AND friend_id = requesting_user_id)
  LIMIT 1;
  
  RETURN COALESCE(friend_status, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search users by display name or email
CREATE OR REPLACE FUNCTION search_users(
  search_term TEXT,
  requesting_user_id UUID,
  result_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER,
  xp INTEGER,
  friendship_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.level,
    p.xp,
    COALESCE(
      (SELECT f.status 
       FROM friendships f 
       WHERE (f.user_id = requesting_user_id AND f.friend_id = p.id)
          OR (f.user_id = p.id AND f.friend_id = requesting_user_id)
       LIMIT 1
      ),
      'none'
    ) as friendship_status
  FROM profiles p
  WHERE p.id != requesting_user_id
    AND (
      p.display_name ILIKE '%' || search_term || '%'
      OR EXISTS (
        SELECT 1 FROM auth.users u 
        WHERE u.id = p.id 
        AND u.email ILIKE '%' || search_term || '%'
      )
    )
  ORDER BY 
    CASE 
      WHEN p.display_name ILIKE search_term || '%' THEN 1
      WHEN p.display_name ILIKE '%' || search_term || '%' THEN 2
      ELSE 3
    END,
    p.xp DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get friends list
CREATE OR REPLACE FUNCTION get_friends_list(
  requesting_user_id UUID
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER,
  xp INTEGER,
  last_active_date DATE,
  friendship_id UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.avatar_url,
    p.level,
    p.xp,
    p.last_active_date,
    f.id as friendship_id,
    f.created_at
  FROM friendships f
  JOIN profiles p ON (
    CASE 
      WHEN f.user_id = requesting_user_id THEN p.id = f.friend_id
      ELSE p.id = f.user_id
    END
  )
  WHERE (f.user_id = requesting_user_id OR f.friend_id = requesting_user_id)
    AND f.status = 'accepted'
  ORDER BY p.last_active_date DESC NULLS LAST, f.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending friend requests
CREATE OR REPLACE FUNCTION get_pending_requests(
  requesting_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  avatar_url TEXT,
  level INTEGER,
  xp INTEGER,
  requested_at TIMESTAMPTZ,
  friendship_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    f.user_id,
    p.display_name,
    p.avatar_url,
    p.level,
    p.xp,
    f.requested_at,
    f.id as friendship_id
  FROM friendships f
  JOIN profiles p ON p.id = f.user_id
  WHERE f.friend_id = requesting_user_id
    AND f.status = 'pending'
  ORDER BY f.requested_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 4. TRIGGERS
-- =====================================================

-- Update updated_at timestamp on friendships table
CREATE OR REPLACE FUNCTION update_friendship_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF (TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status != 'pending') THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_friendship_timestamp
BEFORE UPDATE ON friendships
FOR EACH ROW
EXECUTE FUNCTION update_friendship_updated_at();

-- =====================================================
-- 5. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE friendships IS 'Manages friend relationships between users';
COMMENT ON COLUMN friendships.status IS 'pending: request sent, accepted: friends, rejected: request declined, blocked: user blocked';
COMMENT ON FUNCTION search_users IS 'Search for users by display name or email with friendship status';
COMMENT ON FUNCTION get_friends_list IS 'Get all accepted friends for a user';
COMMENT ON FUNCTION get_pending_requests IS 'Get all pending friend requests for a user';

-- =====================================================
-- END OF MIGRATION
-- =====================================================
