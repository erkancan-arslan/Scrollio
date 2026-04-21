-- =====================================================
-- ENABLE REALTIME FOR FRIENDSHIPS, CONVERSATIONS, AND MESSAGES
-- =====================================================
-- Without these tables in the supabase_realtime publication, postgres_changes
-- subscriptions never fire, so:
--   • The sender of a friend request never learns when it gets accepted
--     (they only saw the new friend after manually refreshing or relogging).
--   • The recipient of a new chat doesn't see incoming messages or new
--     conversations until they pull-to-refresh.
--
-- Adding the tables here is idempotent and safe to re-run.
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'friendships'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE friendships;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
END $$;

-- Ensure UPDATE/DELETE payloads include the previous row data so subscribers
-- can correctly reconcile state changes (e.g. status: pending → accepted).
ALTER TABLE friendships REPLICA IDENTITY FULL;
ALTER TABLE conversations REPLICA IDENTITY FULL;
ALTER TABLE messages REPLICA IDENTITY FULL;
