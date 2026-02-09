-- =====================================================
-- FINAL FIX: Production-safe chat RLS policies
-- =====================================================
-- This migration combines all the fixes needed for a secure, working chat system

-- Step 1: Drop all existing conversation_participants policies
DROP POLICY IF EXISTS "Users can view participants in their conversations" ON conversation_participants;
DROP POLICY IF EXISTS "Users can update own participant record" ON conversation_participants;
DROP POLICY IF EXISTS "System can create conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can join conversations they're invited to" ON conversation_participants;
DROP POLICY IF EXISTS "Allow authenticated insert" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view own participant records" ON conversation_participants;
DROP POLICY IF EXISTS "Users can delete own participant record" ON conversation_participants;
DROP POLICY IF EXISTS "Allow insert through RPC functions only" ON conversation_participants;

-- Step 2: Clean up broken conversations (conversations without participants)
DELETE FROM conversations
WHERE id IN (
  SELECT c.id
  FROM conversations c
  LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id
  WHERE cp.conversation_id IS NULL
);

-- Step 3: Create production-safe policies
-- These policies prevent infinite recursion and ensure security

-- SELECT: Users can only see their own participant records
-- This is safe because it doesn't cause recursion - just checks auth.uid() = user_id
CREATE POLICY "Users can view own participant records"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- INSERT: Block direct inserts, force use of RPC functions
-- The RPC function get_or_create_direct_conversation is SECURITY DEFINER
-- and bypasses RLS, but validates friendship before creating participants
CREATE POLICY "Allow insert through RPC functions only"
  ON conversation_participants FOR INSERT
  WITH CHECK (false);

-- UPDATE: Users can only update their own participant record (e.g., last_read_at)
CREATE POLICY "Users can update own participant record"
  ON conversation_participants FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can only delete their own participant record (leave conversation)
CREATE POLICY "Users can delete own participant record"
  ON conversation_participants FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- Summary of the security model:
-- =====================================================
-- 1. Users can only see their own participant records (prevents data leaks)
-- 2. Direct INSERT is blocked - users must use get_or_create_direct_conversation()
--    which validates friendship before creating conversations
-- 3. Backend uses service role (admin client) for internal validation checks,
--    bypassing RLS and preventing recursion issues
-- 4. User operations (messages, updates) use regular client with RLS
-- =====================================================
