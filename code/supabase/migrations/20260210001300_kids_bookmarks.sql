-- Kids content bookmarks

CREATE TABLE IF NOT EXISTS public.kids_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.kids_content(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (child_profile_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_child ON public.kids_bookmarks(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_content ON public.kids_bookmarks(content_id);

ALTER TABLE public.kids_bookmarks ENABLE ROW LEVEL SECURITY;

-- Parents can manage bookmarks for their children
CREATE POLICY "Parents can view own children bookmarks"
    ON public.kids_bookmarks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert bookmarks for own children"
    ON public.kids_bookmarks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can delete bookmarks for own children"
    ON public.kids_bookmarks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
