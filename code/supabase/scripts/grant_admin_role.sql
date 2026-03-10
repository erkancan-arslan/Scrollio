-- Grant admin role to a user
-- 1. Get your User UID from Supabase Dashboard → Authentication → Users
-- 2. Replace the UUID below with your User UID
-- 3. Run this in SQL Editor (Supabase Dashboard → SQL Editor → New query → Paste → Run)

INSERT INTO public.user_roles (user_id, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- ← Replace with your User UID
  'admin'
)
ON CONFLICT (user_id, role) DO NOTHING;
