-- Kids voice interactions for AI assistant

CREATE TABLE IF NOT EXISTS public.kids_voice_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    transcript TEXT,
    intent TEXT,
    response TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voice_interactions_child ON public.kids_voice_interactions(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_voice_interactions_intent ON public.kids_voice_interactions(intent);

ALTER TABLE public.kids_voice_interactions ENABLE ROW LEVEL SECURITY;

-- Parents can view their children's voice interactions
CREATE POLICY "Parents can view own children voice interactions"
    ON public.kids_voice_interactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- Parents can insert voice interactions for their children
CREATE POLICY "Parents can insert voice interactions for own children"
    ON public.kids_voice_interactions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
