-- =====================================================
-- ADD 'post' MESSAGE TYPE + metadata JSONB COLUMN
-- =====================================================
-- Enables sharing a feed video to a friend via chat. The shared post is stored
-- as a regular message with:
--   • message_type = 'post'
--   • media_url    = the video id (UUID stored as text — same column already
--                    used for image/video URLs; we reuse it as a payload ref)
--   • thumbnail_url = the thumbnail URL for the preview bubble in chat
--   • metadata     = JSONB { videoId, title, creatorName, duration, ... } so
--                    the chat bubble can render a rich preview without needing
--                    an extra round-trip to the feed API just to draw the card
--   • content      = optional caption typed by the sender
--
-- The conversation preview trigger is updated so the inbox shows a friendly
-- "📹 Shared a video" string for these messages instead of the videoId.
--
-- Idempotent and safe to re-run.
-- =====================================================

-- 1. Extend the message_type CHECK constraint to allow 'post'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'messages_message_type_check'
      AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT messages_message_type_check;
  END IF;
END $$;

ALTER TABLE messages
  ADD CONSTRAINT messages_message_type_check
  CHECK (message_type IN ('text', 'image', 'video', 'audio', 'file', 'post'));

-- 2. Add metadata JSONB column (used by 'post' today, available for any
--    future structured payload — e.g. game invites, classroom invites).
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN messages.metadata IS
  'Structured payload for non-text messages. For message_type=''post'' contains '
  '{ videoId, title, creatorName, creatorAvatar, duration }.';

-- 3. Allow content to be optional for 'post' (NULL is already allowed by the
--    column definition, so nothing to change at the DB level — backend DTO is
--    where we relax the @IsString requirement).

-- 4. Update the conversation preview trigger so the inbox shows a friendly
--    label instead of the raw caption (which may be empty for shared posts).
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    last_message_preview = CASE
      WHEN NEW.message_type = 'text'  THEN SUBSTRING(NEW.content, 1, 100)
      WHEN NEW.message_type = 'image' THEN '📷 Photo'
      WHEN NEW.message_type = 'video' THEN '🎥 Video'
      WHEN NEW.message_type = 'audio' THEN '🎤 Voice message'
      WHEN NEW.message_type = 'post'  THEN
        CASE
          WHEN NEW.content IS NOT NULL AND length(trim(NEW.content)) > 0
            THEN '📹 ' || SUBSTRING(NEW.content, 1, 90)
          ELSE '📹 Shared a video'
        END
      ELSE '📎 File'
    END,
    last_sender_id = NEW.sender_id,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
