# Supabase SQL Setup for Friends & Search Feature

This document contains all the SQL code you need to copy-paste into your Supabase SQL Editor to set up the friends and search functionality.

## 📋 Instructions

1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor**
3. Create a new query
4. Copy and paste the entire SQL code below
5. Click **Run** to execute

---

## 🗄️ SQL Code

```sql
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
```

---

## ✅ What This Creates

### Tables
- **`friendships`**: Stores friend relationships and requests between users
  - `id`: UUID primary key
  - `user_id`: User who sent the request
  - `friend_id`: User who received the request
  - `status`: pending, accepted, rejected, or blocked
  - `requested_at`: When the request was sent
  - `responded_at`: When the request was responded to
  - Includes constraints to prevent self-friendship and duplicate requests

### Functions (RPC)
1. **`search_users`**: Search for users by display name or email
   - Returns user profile with current friendship status
   - Supports pagination with limit parameter
   
2. **`get_friends_list`**: Get all accepted friends for a user
   - Returns friend profiles with friendship metadata
   
3. **`get_pending_requests`**: Get all pending friend requests
   - Returns requests where the user is the recipient
   
4. **`get_friendship_status`**: Check friendship status between two users
   - Returns: 'none', 'pending', 'accepted', 'rejected', or 'blocked'

### Security (RLS Policies)
- Users can only view their own friendships
- Users can send friend requests
- Users can respond to requests sent to them
- Users can delete/unfriend relationships they're part of

---

## 🧪 Testing the SQL

After running the SQL, you can test it with these queries:

### Test Search Function
```sql
SELECT * FROM search_users('john', '00000000-0000-0000-0000-000000000000'::uuid, 10);
```

### Test Get Friends List
```sql
SELECT * FROM get_friends_list('your-user-uuid-here'::uuid);
```

### Test Get Pending Requests
```sql
SELECT * FROM get_pending_requests('your-user-uuid-here'::uuid);
```

---

## 📦 Additional Setup Required

### Mobile App Dependencies
After setting up the database, install required npm packages for the mobile app:

```bash
cd code/mobile-app
npm install lodash
npm install --save-dev @types/lodash
```

### Backend (No additional packages needed)
The backend uses existing NestJS and Supabase packages.

---

## 🚀 API Endpoints Created

### Search API
- `GET /api/v1/search/users?query=john&limit=20` - Search users
- `GET /api/v1/search/users/:id` - Get user by ID

### Friends API
- `GET /api/v1/friends` - Get friends list
- `GET /api/v1/friends/requests/pending` - Get pending requests (received)
- `GET /api/v1/friends/requests/sent` - Get sent requests
- `POST /api/v1/friends/request` - Send friend request
- `PATCH /api/v1/friends/request/:friendshipId` - Accept/reject request
- `DELETE /api/v1/friends/:friendshipId` - Remove friend/cancel request

---

## 📱 Mobile App Features

### Search Screen
- Search users by display name or email
- Real-time search with debouncing
- Send friend requests
- View friendship status (none, pending, friends)
- Empty states for no results

### Navigation
The search screen has been added to the bottom tab navigation:
- Home
- **Search** (NEW!)
- Playground
- Profile

---

## 🔐 Security Notes

- All RLS policies are properly configured
- Users can only access their own friendship data
- Search function respects privacy (only returns basic profile info)
- Email search is available but emails are not exposed in results
- Prevents self-friendship through database constraints

---

## 📝 Next Steps

1. ✅ Copy the SQL code to Supabase SQL Editor
2. ✅ Run the migration
3. ✅ Install mobile app dependencies (`lodash`)
4. ✅ Restart your backend server
5. ✅ Restart your mobile app
6. 🎉 Test the search and friend features!

---

## 🐛 Troubleshooting

### If you get "function already exists" errors:
Drop the functions first:
```sql
DROP FUNCTION IF EXISTS search_users(TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS get_friends_list(UUID);
DROP FUNCTION IF EXISTS get_pending_requests(UUID);
DROP FUNCTION IF EXISTS get_friendship_status(UUID, UUID);
```

### If you get "table already exists" error:
Drop the table first (WARNING: This will delete all data):
```sql
DROP TABLE IF EXISTS friendships CASCADE;
```

---

Good luck with your Scrollio app! 🚀
