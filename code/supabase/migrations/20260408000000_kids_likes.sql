-- Kids content likes (mirrors kids_bookmarks pattern)

CREATE TABLE IF NOT EXISTS public.kids_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES public.kids_content(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (child_profile_id, content_id)
);

CREATE INDEX IF NOT EXISTS idx_kids_likes_child ON public.kids_likes(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_kids_likes_content ON public.kids_likes(content_id);

ALTER TABLE public.kids_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents can view own children likes"
    ON public.kids_likes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert likes for own children"
    ON public.kids_likes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can delete likes for own children"
    ON public.kids_likes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
