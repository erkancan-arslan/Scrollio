-- Reset admin: remove old admin role rows, remove prior admin@scrollio.* auth users, create admin@scrollio.co / abc123
--
-- SECURITY: Dev/bootstrap only — change password after first login (Dashboard → Authentication → Users).
-- Requires: Extension "pgcrypto" enabled (Dashboard → Database → Extensions). Uses bcrypt via crypt()/gen_salt().
-- If DELETE auth.users still fails, some other table references that user — clear it in SQL or Dashboard.

SET search_path = public, extensions, auth;

-- 1) Drop admin role assignments (does not delete auth users by itself)
DELETE FROM public.user_roles WHERE role = 'admin';

-- 2) Break FKs from app tables → users we will delete (must run per UUID; IN-subquery can miss rows in some setups)
DO $$
DECLARE
  uid uuid;
BEGIN
  FOR uid IN
    SELECT u.id
    FROM auth.users u
    WHERE lower(trim(coalesce(u.email, ''))) IN ('admin@scrollio.co', 'admin@scrollio.com')
  LOOP
    UPDATE public.reference_videos SET uploaded_by = NULL WHERE uploaded_by = uid;
    UPDATE public.generated_video_jobs SET created_by = NULL WHERE created_by = uid;
    UPDATE public.generated_videos SET published_by = NULL WHERE published_by = uid;
    UPDATE public.user_roles SET granted_by = NULL WHERE granted_by = uid;
  END LOOP;
END $$;

-- 2b) Same FK cleanup via UPDATE…FROM (belt-and-suspenders if 2a subquery visibility differed)
UPDATE public.reference_videos rv
SET uploaded_by = NULL
FROM auth.users u
WHERE rv.uploaded_by = u.id
  AND lower(trim(coalesce(u.email, ''))) IN ('admin@scrollio.co', 'admin@scrollio.com');

UPDATE public.generated_video_jobs j
SET created_by = NULL
FROM auth.users u
WHERE j.created_by = u.id
  AND lower(trim(coalesce(u.email, ''))) IN ('admin@scrollio.co', 'admin@scrollio.com');

UPDATE public.generated_videos gv
SET published_by = NULL
FROM auth.users u
WHERE gv.published_by = u.id
  AND lower(trim(coalesce(u.email, ''))) IN ('admin@scrollio.co', 'admin@scrollio.com');

UPDATE public.user_roles ur
SET granted_by = NULL
FROM auth.users u
WHERE ur.granted_by = u.id
  AND lower(trim(coalesce(u.email, ''))) IN ('admin@scrollio.co', 'admin@scrollio.com');

-- 3) Remove existing identities + users for those emails
DELETE FROM auth.identities
WHERE user_id IN (
  SELECT id FROM auth.users WHERE lower(email) IN (
    'admin@scrollio.co',
    'admin@scrollio.com'
  )
);

DELETE FROM auth.users
WHERE lower(email) IN ('admin@scrollio.co', 'admin@scrollio.com');

-- 4) Create new admin user + email identity + admin role
DO $$
DECLARE
  new_uid uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token,
    is_sso_user,
    is_anonymous
  ) VALUES (
    new_uid,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@scrollio.co',
    crypt('abc123', gen_salt('bf')),
    now(),
    jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    false,
    false
  );

  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(),
    new_uid,
    jsonb_build_object(
      'sub', new_uid::text,
      'email', 'admin@scrollio.co',
      'email_verified', true,
      'phone_verified', false,
      'provider', 'email'
    ),
    'email',
    new_uid::text,
    now(),
    now(),
    now()
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (new_uid, 'admin'::user_role);
END $$;
