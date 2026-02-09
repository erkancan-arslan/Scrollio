-- =====================================================
-- CHAT SYSTEM FOR SCROLLIO
-- =====================================================
-- Real-time messaging between friends
-- Created: 2026-02-09

-- =====================================================
-- 1. CONVERSATIONS TABLE
-- =====================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Indexes
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC NULLS LAST);
CREATE INDEX idx_conversations_type ON conversations(type);

COMMENT ON TABLE conversations IS 'Chat conversations between users';
COMMENT ON COLUMN conversations.type IS 'direct: one-on-one, group: group chat (future)';

-- =====================================================
-- 2. CONVERSATION PARTICIPANTS TABLE
-- =====================================================

CREATE TABLE conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  is_muted BOOLEAN DEFAULT false,
  notifications_enabled BOOLEAN DEFAULT true,
  UNIQUE(conversation_id, user_id)
);

-- Indexes
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_last_read ON conversation_participants(last_read_at);

COMMENT ON TABLE conversation_participants IS 'Users participating in conversations';

-- =====================================================
-- 3. MESSAGES TABLE
-- =====================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file')),
  media_url TEXT,
  thumbnail_url TEXT,
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

COMMENT ON TABLE messages IS 'Chat messages';
COMMENT ON COLUMN messages.message_type IS 'text, image, video, audio, or file';

-- =====================================================
-- 4. MESSAGE READ RECEIPTS TABLE
-- =====================================================

CREATE TABLE message_read_receipts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

-- Index
CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id);
CREATE INDEX idx_read_receipts_user ON message_read_receipts(user_id);

COMMENT ON TABLE message_read_receipts IS 'Track which users have read which messages';

-- =====================================================
-- 5. FCM TOKENS TABLE
-- =====================================================

CREATE TABLE fcm_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  device_id TEXT,
  device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_fcm_tokens_user ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);

COMMENT ON TABLE fcm_tokens IS 'Firebase Cloud Messaging tokens for push notifications';

-- =====================================================
-- 6. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Conversation Participants
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can edit own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id);

-- Message Read Receipts
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view read receipts for their messages"
  ON message_read_receipts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE m.id = message_read_receipts.message_id
      AND cp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create own read receipts"
  ON message_read_receipts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- FCM Tokens
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own FCM tokens"
  ON fcm_tokens FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 7. DATABASE FUNCTIONS
-- =====================================================

-- Function: Get or Create Direct Conversation
CREATE OR REPLACE FUNCTION get_or_create_direct_conversation(
  user1_id UUID,
  user2_id UUID
)
RETURNS UUID AS $$
DECLARE
  conversation_id UUID;
  friendship_status TEXT;
BEGIN
  -- Check if users are friends
  SELECT status INTO friendship_status
  FROM friendships
  WHERE (user_id = user1_id AND friend_id = user2_id)
     OR (user_id = user2_id AND friend_id = user1_id)
  LIMIT 1;
  
  IF friendship_status IS NULL THEN
    RAISE EXCEPTION 'Users are not connected';
  END IF;
  
  IF friendship_status != 'accepted' THEN
    RAISE EXCEPTION 'Users must be friends to chat';
  END IF;
  
  -- Check if conversation already exists
  SELECT c.id INTO conversation_id
  FROM conversations c
  WHERE c.type = 'direct'
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp1
    WHERE cp1.conversation_id = c.id AND cp1.user_id = user1_id
  )
  AND EXISTS (
    SELECT 1 FROM conversation_participants cp2
    WHERE cp2.conversation_id = c.id AND cp2.user_id = user2_id
  )
  AND (
    SELECT COUNT(*) FROM conversation_participants cp
    WHERE cp.conversation_id = c.id
  ) = 2;
  
  -- If exists, return it
  IF conversation_id IS NOT NULL THEN
    RETURN conversation_id;
  END IF;
  
  -- Create new conversation
  INSERT INTO conversations (type) VALUES ('direct')
  RETURNING id INTO conversation_id;
  
  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (conversation_id, user1_id), (conversation_id, user2_id);
  
  RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_direct_conversation IS 'Get existing or create new direct conversation between friends';

-- Function: Get Unread Message Count per Conversation
CREATE OR REPLACE FUNCTION get_unread_message_count(requesting_user_id UUID)
RETURNS TABLE(conversation_id UUID, unread_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.conversation_id,
    COUNT(*)::BIGINT as unread_count
  FROM messages m
  JOIN conversation_participants cp 
    ON cp.conversation_id = m.conversation_id
    AND cp.user_id = requesting_user_id
  WHERE m.created_at > cp.last_read_at
    AND m.sender_id != requesting_user_id
    AND m.is_deleted = false
  GROUP BY m.conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_unread_message_count IS 'Get unread message count for each conversation';

-- Function: Mark Conversation as Read
CREATE OR REPLACE FUNCTION mark_conversation_read(
  requesting_user_id UUID,
  conv_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE conversation_participants
  SET last_read_at = NOW()
  WHERE user_id = requesting_user_id
  AND conversation_id = conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_conversation_read IS 'Mark all messages in a conversation as read';

-- Function: Get Conversations with Details
CREATE OR REPLACE FUNCTION get_user_conversations(requesting_user_id UUID)
RETURNS TABLE(
  conversation_id UUID,
  conversation_type TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_sender_id UUID,
  unread_count BIGINT,
  other_user_id UUID,
  other_user_display_name TEXT,
  other_user_avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as conversation_id,
    c.type as conversation_type,
    c.last_message_at,
    c.last_message_preview,
    c.last_sender_id,
    COALESCE(unread.unread_count, 0) as unread_count,
    -- For direct messages, get the other user's info
    CASE 
      WHEN c.type = 'direct' THEN other_participant.user_id
      ELSE NULL
    END as other_user_id,
    CASE 
      WHEN c.type = 'direct' THEN other_profile.display_name
      ELSE NULL
    END as other_user_display_name,
    CASE 
      WHEN c.type = 'direct' THEN other_profile.avatar_url
      ELSE NULL
    END as other_user_avatar_url
  FROM conversations c
  JOIN conversation_participants my_participation 
    ON my_participation.conversation_id = c.id 
    AND my_participation.user_id = requesting_user_id
  LEFT JOIN conversation_participants other_participant 
    ON other_participant.conversation_id = c.id 
    AND other_participant.user_id != requesting_user_id
    AND c.type = 'direct'
  LEFT JOIN profiles other_profile 
    ON other_profile.id = other_participant.user_id
  LEFT JOIN LATERAL (
    SELECT COUNT(*)::BIGINT as unread_count
    FROM messages m
    WHERE m.conversation_id = c.id
    AND m.created_at > my_participation.last_read_at
    AND m.sender_id != requesting_user_id
    AND m.is_deleted = false
  ) unread ON true
  ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_user_conversations IS 'Get all conversations for a user with details and unread counts';

-- =====================================================
-- 8. TRIGGERS
-- =====================================================

-- Update conversation when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = CASE 
      WHEN NEW.message_type = 'text' THEN SUBSTRING(NEW.content, 1, 100)
      WHEN NEW.message_type = 'image' THEN '📷 Photo'
      WHEN NEW.message_type = 'video' THEN '🎥 Video'
      WHEN NEW.message_type = 'audio' THEN '🎤 Voice message'
      ELSE '📎 File'
    END,
    last_sender_id = NEW.sender_id,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_on_message();

-- Update updated_at timestamp on messages
CREATE OR REPLACE FUNCTION update_message_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_message_timestamp
BEFORE UPDATE ON messages
FOR EACH ROW
EXECUTE FUNCTION update_message_updated_at();

-- Update updated_at timestamp on conversations
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
BEFORE UPDATE ON conversations
FOR EACH ROW
EXECUTE FUNCTION update_conversation_updated_at();

-- Update last_used_at on FCM tokens
CREATE OR REPLACE FUNCTION update_fcm_token_last_used()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_used_at = NOW();
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fcm_token_timestamp
BEFORE UPDATE ON fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION update_fcm_token_last_used();

-- =====================================================
-- END OF MIGRATION
-- =====================================================

COMMENT ON SCHEMA public IS 'Chat system with real-time messaging, notifications, and read receipts';
