-- Add role system for Kids module
-- This is ADDITIVE to existing schema

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'parent', 'kid', 'school');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User roles join table (supports multiple roles per user)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    granted_by UUID REFERENCES auth.users(id),
    UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
    ON public.user_roles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage roles"
    ON public.user_roles FOR ALL
    USING (true)
    WITH CHECK (true);
