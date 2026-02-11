-- Kids feed views / watch history tracking

CREATE TABLE IF NOT EXISTS public.kids_feed_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.kids_content(id) ON DELETE CASCADE,
    watched_seconds INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feed_views_child ON public.kids_feed_views(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_feed_views_content ON public.kids_feed_views(content_id);
CREATE INDEX IF NOT EXISTS idx_feed_views_child_content ON public.kids_feed_views(child_profile_id, content_id);

ALTER TABLE public.kids_feed_views ENABLE ROW LEVEL SECURITY;

-- Parents can view their children's feed views
CREATE POLICY "Parents can view own children feed views"
    ON public.kids_feed_views FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- Parents can insert feed views for their children
CREATE POLICY "Parents can insert feed views for own children"
    ON public.kids_feed_views FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- Parents can update feed views for their children
CREATE POLICY "Parents can update feed views for own children"
    ON public.kids_feed_views FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
