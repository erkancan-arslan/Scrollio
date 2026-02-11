-- Kids activity logs for analytics and parental insights

CREATE TABLE IF NOT EXISTS public.kids_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_child ON public.kids_activity_logs(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_event_type ON public.kids_activity_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.kids_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_child_event_time ON public.kids_activity_logs(child_profile_id, event_type, created_at);

ALTER TABLE public.kids_activity_logs ENABLE ROW LEVEL SECURITY;

-- Parents can view activity logs for their children
CREATE POLICY "Parents can view own children activity logs"
    ON public.kids_activity_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- Parents can insert activity logs for their children
CREATE POLICY "Parents can insert activity logs for own children"
    ON public.kids_activity_logs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
