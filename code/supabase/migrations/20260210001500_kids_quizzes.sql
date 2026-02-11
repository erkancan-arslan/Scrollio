-- Kids quizzes and quiz attempts

-- Quizzes linked to content
CREATE TABLE IF NOT EXISTS public.kids_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL REFERENCES public.kids_content(id) ON DELETE CASCADE,
    questions JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quizzes_content ON public.kids_quizzes(content_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_is_active ON public.kids_quizzes(is_active);

ALTER TABLE public.kids_quizzes ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active quizzes
CREATE POLICY "Authenticated users can read active quizzes"
    ON public.kids_quizzes FOR SELECT
    USING (auth.role() = 'authenticated' AND is_active = true);

-- Quiz attempts by children
CREATE TABLE IF NOT EXISTS public.kids_quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES public.kids_quizzes(id) ON DELETE CASCADE,
    answers JSONB NOT NULL DEFAULT '[]',
    score INT NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_child ON public.kids_quiz_attempts(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.kids_quiz_attempts(quiz_id);

ALTER TABLE public.kids_quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Parents can view their children's quiz attempts
CREATE POLICY "Parents can view own children quiz attempts"
    ON public.kids_quiz_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- Parents can insert quiz attempts for their children
CREATE POLICY "Parents can insert quiz attempts for own children"
    ON public.kids_quiz_attempts FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- Parents can update quiz attempts for their children
CREATE POLICY "Parents can update quiz attempts for own children"
    ON public.kids_quiz_attempts FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
