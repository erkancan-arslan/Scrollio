-- Kids notification settings per child profile

CREATE TABLE IF NOT EXISTS public.kids_notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL UNIQUE REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{"push": true, "email": false}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_settings_child ON public.kids_notification_settings(child_profile_id);

ALTER TABLE public.kids_notification_settings ENABLE ROW LEVEL SECURITY;

-- Parents can manage notification settings for their children
CREATE POLICY "Parents can view own children notification settings"
    ON public.kids_notification_settings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert notification settings for own children"
    ON public.kids_notification_settings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update notification settings for own children"
    ON public.kids_notification_settings FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
