-- Child profiles managed by parents

CREATE TABLE IF NOT EXISTS public.kids_child_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_config JSONB DEFAULT '{}',
    date_of_birth DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_child_profiles_parent ON public.kids_child_profiles(parent_id);

ALTER TABLE public.kids_child_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage own children"
    ON public.kids_child_profiles FOR ALL
    USING (auth.uid() = parent_id)
    WITH CHECK (auth.uid() = parent_id);
