-- Kids playground: drawings and animated characters

-- Drawings created by children
CREATE TABLE IF NOT EXISTS public.kids_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    image_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drawings_child ON public.kids_drawings(child_profile_id);

ALTER TABLE public.kids_drawings ENABLE ROW LEVEL SECURITY;

-- Parents can manage drawings for their children
CREATE POLICY "Parents can view own children drawings"
    ON public.kids_drawings FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert drawings for own children"
    ON public.kids_drawings FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can delete drawings for own children"
    ON public.kids_drawings FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- Animated characters created from drawings
CREATE TABLE IF NOT EXISTS public.kids_characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_id UUID NOT NULL REFERENCES public.kids_drawings(id) ON DELETE CASCADE,
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    character_data JSONB NOT NULL DEFAULT '{}',
    animation_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_characters_drawing ON public.kids_characters(drawing_id);
CREATE INDEX IF NOT EXISTS idx_characters_child ON public.kids_characters(child_profile_id);

ALTER TABLE public.kids_characters ENABLE ROW LEVEL SECURITY;

-- Parents can manage characters for their children
CREATE POLICY "Parents can view own children characters"
    ON public.kids_characters FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert characters for own children"
    ON public.kids_characters FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update characters for own children"
    ON public.kids_characters FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can delete characters for own children"
    ON public.kids_characters FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
