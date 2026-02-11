-- Kids parental settings and screen time rules

-- Parental settings per child profile
CREATE TABLE IF NOT EXISTS public.kids_parental_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parental_settings_parent ON public.kids_parental_settings(parent_id);
CREATE INDEX IF NOT EXISTS idx_parental_settings_child ON public.kids_parental_settings(child_profile_id);

ALTER TABLE public.kids_parental_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage own parental settings"
    ON public.kids_parental_settings FOR ALL
    USING (auth.uid() = parent_id)
    WITH CHECK (auth.uid() = parent_id);

-- Screen time rules per child profile
CREATE TABLE IF NOT EXISTS public.kids_screen_time_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL UNIQUE REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    daily_limit_minutes INT NOT NULL DEFAULT 60,
    schedule JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_screen_time_rules_child ON public.kids_screen_time_rules(child_profile_id);

ALTER TABLE public.kids_screen_time_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can manage screen time rules for own children"
    ON public.kids_screen_time_rules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
