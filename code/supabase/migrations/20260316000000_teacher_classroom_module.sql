-- Teacher Classroom Module (LipClass)
-- Tables: teacher_profiles, classrooms, classroom_members, teacher_lessons, teacher_lesson_analytics

-- Add 'teacher' to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'teacher';

-- ============================================================
-- 1. teacher_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    school TEXT,
    subject TEXT,
    reference_video_url TEXT,
    reference_video_storage_path TEXT,
    reference_video_status TEXT NOT NULL DEFAULT 'none' CHECK (reference_video_status IN ('none', 'processing', 'ready')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own profile"
    ON public.teacher_profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Teachers can update own profile"
    ON public.teacher_profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access teacher_profiles"
    ON public.teacher_profiles FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 2. classrooms
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    subject TEXT,
    grade TEXT,
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_classrooms_teacher ON public.classrooms(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classrooms_code ON public.classrooms(code);

ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own classrooms"
    ON public.classrooms FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Service role full access classrooms"
    ON public.classrooms FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 3. classroom_members
-- ============================================================
CREATE TABLE IF NOT EXISTS public.classroom_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(classroom_id, child_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom ON public.classroom_members(classroom_id);
CREATE INDEX IF NOT EXISTS idx_classroom_members_child ON public.classroom_members(child_profile_id);

ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access classroom_members"
    ON public.classroom_members FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 4. teacher_lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teacher_profiles(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    topic TEXT NOT NULL,
    description TEXT,
    subject TEXT,
    grade TEXT,
    tone TEXT NOT NULL DEFAULT 'friendly' CHECK (tone IN ('formal', 'friendly', 'energetic')),
    language TEXT NOT NULL DEFAULT 'tr' CHECK (language IN ('tr', 'en')),
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    includes_problem_solving BOOLEAN DEFAULT false,
    problem_count INTEGER DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'processing', 'published', 'failed')),
    slides_data JSONB,
    duration INTEGER,
    current_step TEXT,
    progress_percent INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teacher_lessons_teacher ON public.teacher_lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_lessons_classroom ON public.teacher_lessons(classroom_id);
CREATE INDEX IF NOT EXISTS idx_teacher_lessons_status ON public.teacher_lessons(status);

ALTER TABLE public.teacher_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage own lessons"
    ON public.teacher_lessons FOR ALL
    USING (auth.uid() = teacher_id)
    WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Service role full access teacher_lessons"
    ON public.teacher_lessons FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- 5. teacher_lesson_analytics
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_lesson_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.teacher_lessons(id) ON DELETE CASCADE,
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    watched_duration INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    liked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_analytics_lesson ON public.teacher_lesson_analytics(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_analytics_child ON public.teacher_lesson_analytics(child_profile_id);

ALTER TABLE public.teacher_lesson_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access teacher_lesson_analytics"
    ON public.teacher_lesson_analytics FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================
-- Helper: generate random 6-char alphanumeric classroom code
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_classroom_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
