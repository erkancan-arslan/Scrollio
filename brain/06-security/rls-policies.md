# Row Level Security (RLS) Policies

## Critical Rule
**ALL Supabase tables MUST have RLS enabled.** Never create a table without RLS policies. This is non-negotiable for security.

## RLS Policy Patterns

### 1. Public Read, Authenticated Write
Use for: Content that everyone can see, but only logged-in users can modify.

```sql
-- Enable RLS
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Anyone can read
CREATE POLICY "Videos are publicly readable"
ON videos FOR SELECT
TO public
USING (true);

-- Only authenticated users can insert their own
CREATE POLICY "Users can insert own videos"
ON videos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Only owners can update
CREATE POLICY "Users can update own videos"
ON videos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Only owners can delete
CREATE POLICY "Users can delete own videos"
ON videos FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### 2. User-Scoped Data (Private)
Use for: User-specific data that should only be visible to the owner.

```sql
-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
ON user_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

### 3. Parent-Controlled Data (COPPA Compliance)
Use for: Child accounts where parents control the data.

```sql
-- Enable RLS
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;

-- Parents can see their children's profiles
CREATE POLICY "Parents can view child profiles"
ON child_profiles FOR SELECT
TO authenticated
USING (
  parent_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM parent_child_relationships
    WHERE parent_id = auth.uid() AND child_id = child_profiles.id
  )
);

-- Only parents can create child profiles
CREATE POLICY "Parents can create child profiles"
ON child_profiles FOR INSERT
TO authenticated
WITH CHECK (parent_id = auth.uid());

-- Only parents can update child profiles
CREATE POLICY "Parents can update child profiles"
ON child_profiles FOR UPDATE
TO authenticated
USING (parent_id = auth.uid())
WITH CHECK (parent_id = auth.uid());

-- Only parents can delete child profiles
CREATE POLICY "Parents can delete child profiles"
ON child_profiles FOR DELETE
TO authenticated
USING (parent_id = auth.uid());
```

### 4. Role-Based Access Control (RBAC)
Use for: Admin/moderator features.

```sql
-- Enable RLS
ALTER TABLE flagged_content ENABLE ROW LEVEL SECURITY;

-- Only moderators can view flagged content
CREATE POLICY "Moderators can view flagged content"
ON flagged_content FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('moderator', 'admin')
  )
);

-- Any authenticated user can flag content
CREATE POLICY "Users can flag content"
ON flagged_content FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

-- Only moderators can update flags
CREATE POLICY "Moderators can update flags"
ON flagged_content FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('moderator', 'admin')
  )
);
```

### 5. Time-Based Policies
Use for: Content that expires or has limited access windows.

```sql
-- Enable RLS
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their quiz attempts for 30 days
CREATE POLICY "Users can view recent quiz attempts"
ON quiz_attempts FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND created_at > NOW() - INTERVAL '30 days'
);
```

### 6. Relationship-Based Policies
Use for: Data that requires checking relationships between tables.

```sql
-- Enable RLS
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Users can view results for quizzes they've taken
CREATE POLICY "Users can view own quiz results"
ON quiz_results FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM quiz_attempts
    WHERE quiz_attempts.id = quiz_results.attempt_id
    AND quiz_attempts.user_id = auth.uid()
  )
);
```

## Testing RLS Policies

### Backend Testing Pattern
```typescript
// src/supabase/supabase.service.ts
async testRLSPolicy(userId: string, tableName: string) {
  // Impersonate user for testing
  const { data, error } = await this.supabase
    .from(tableName)
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('RLS test failed:', error);
    return false;
  }

  return true;
}
```

### Manual Testing in Supabase SQL Editor
```sql
-- Test as specific user
SET LOCAL role TO authenticated;
SET LOCAL "request.jwt.claims" TO '{"sub": "user-uuid-here"}';

-- Try to read data
SELECT * FROM videos WHERE user_id != 'user-uuid-here';
-- Should return empty if RLS is working

-- Try to insert data for another user
INSERT INTO videos (user_id, title) VALUES ('different-user-uuid', 'Test');
-- Should fail with permission denied

-- Reset
RESET role;
```

## Common RLS Mistakes to Avoid

### ❌ DON'T: Forget to enable RLS
```sql
-- This is WRONG - no RLS enabled
CREATE TABLE videos (...);
```

### ✅ DO: Always enable RLS immediately
```sql
-- This is CORRECT
CREATE TABLE videos (...);
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY ...
```

### ❌ DON'T: Use overly permissive policies
```sql
-- This is WRONG - allows anyone to do anything
CREATE POLICY "Allow all"
ON videos FOR ALL
TO public
USING (true)
WITH CHECK (true);
```

### ✅ DO: Be specific with permissions
```sql
-- This is CORRECT - specific operations for specific roles
CREATE POLICY "Users can view published videos"
ON videos FOR SELECT
TO public
USING (published = true);

CREATE POLICY "Users can insert own videos"
ON videos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);
```

### ❌ DON'T: Use service role key in client code
```typescript
// This is WRONG - exposes service role key
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

### ✅ DO: Use anon key in client, service role only in backend
```typescript
// Client (React Native) - uses anon key
const supabase = createClient(url, ANON_KEY);

// Backend (NestJS) - can use service role for admin operations
const supabase = createClient(url, SERVICE_ROLE_KEY);
```

## Migration Template

When creating a new table, use this template:

```sql
-- Create table
CREATE TABLE table_name (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS immediately
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Add policies (customize based on requirements)
CREATE POLICY "Users can view own records"
ON table_name FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own records"
ON table_name FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own records"
ON table_name FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own records"
ON table_name FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX idx_table_name_user_id ON table_name(user_id);
CREATE INDEX idx_table_name_created_at ON table_name(created_at);
```

## COPPA-Specific RLS Patterns

### Parent Verification Check
```sql
-- Ensure parent email is verified before allowing child data access
CREATE POLICY "Verified parents can access child data"
ON child_profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = parent_id
    AND email_confirmed_at IS NOT NULL
  )
);
```

### Age-Gated Content
```sql
-- Content appropriate for age groups
CREATE POLICY "Age-appropriate content only"
ON videos FOR SELECT
TO public
USING (
  minimum_age <= (
    SELECT EXTRACT(YEAR FROM AGE(date_of_birth))
    FROM child_profiles
    WHERE id = current_setting('app.current_child_id')::uuid
  )
);
```

## Performance Considerations

### Use Indexes with RLS
```sql
-- RLS policies often filter by user_id
CREATE INDEX idx_videos_user_id ON videos(user_id);

-- Time-based policies need timestamp indexes
CREATE INDEX idx_quiz_attempts_created_at ON quiz_attempts(created_at);
```

### Avoid N+1 Queries in Policies
```sql
-- ❌ BAD: This checks relationships in a loop
CREATE POLICY "Complex relationship check"
ON table_a FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM table_b
    WHERE table_b.a_id = table_a.id
    AND EXISTS (
      SELECT 1 FROM table_c
      WHERE table_c.b_id = table_b.id
    )
  )
);

-- ✅ GOOD: Flatten the relationship check
CREATE POLICY "Optimized relationship check"
ON table_a FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM table_b
    JOIN table_c ON table_c.b_id = table_b.id
    WHERE table_b.a_id = table_a.id
  )
);
```

## References
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Database schema: `/brain/01-architecture/database-schema.md`
- COPPA requirements: `/brain/06-security/data-privacy.md`
