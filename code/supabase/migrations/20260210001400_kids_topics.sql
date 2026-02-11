-- Kids topics and child-topic preferences

-- Topics catalog
CREATE TABLE IF NOT EXISTS public.kids_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    icon_url TEXT,
    category TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kids_topics_category ON public.kids_topics(category);
CREATE INDEX IF NOT EXISTS idx_kids_topics_is_active ON public.kids_topics(is_active);

ALTER TABLE public.kids_topics ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active topics
CREATE POLICY "Authenticated users can read active topics"
    ON public.kids_topics FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- Child-topic preferences (many-to-many)
CREATE TABLE IF NOT EXISTS public.kids_child_topics (
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES public.kids_topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (child_profile_id, topic_id)
);

CREATE INDEX IF NOT EXISTS idx_child_topics_child ON public.kids_child_topics(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_child_topics_topic ON public.kids_child_topics(topic_id);

ALTER TABLE public.kids_child_topics ENABLE ROW LEVEL SECURITY;

-- Parents can manage topic preferences for their children
CREATE POLICY "Parents can view own children topic preferences"
    ON public.kids_child_topics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert topic preferences for own children"
    ON public.kids_child_topics FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can delete topic preferences for own children"
    ON public.kids_child_topics FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
