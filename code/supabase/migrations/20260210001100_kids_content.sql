-- Kids educational content library

CREATE TABLE IF NOT EXISTS public.kids_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    age_group TEXT NOT NULL CHECK (age_group IN ('7-9', '10-12')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    topic_tags TEXT[] NOT NULL DEFAULT '{}',
    duration_seconds INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kids_content_age_group ON public.kids_content(age_group);
CREATE INDEX IF NOT EXISTS idx_kids_content_topic_tags ON public.kids_content USING GIN(topic_tags);
CREATE INDEX IF NOT EXISTS idx_kids_content_created_by ON public.kids_content(created_by);
CREATE INDEX IF NOT EXISTS idx_kids_content_is_active ON public.kids_content(is_active);

ALTER TABLE public.kids_content ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active content
CREATE POLICY "Authenticated users can read active kids content"
    ON public.kids_content FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- Content creators can manage their own content
CREATE POLICY "Creators can manage own kids content"
    ON public.kids_content FOR ALL
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
