-- Kids progression: progress, rewards, and daily missions

-- Child progress tracking (one row per child)
CREATE TABLE IF NOT EXISTS public.kids_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL UNIQUE REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    level INT NOT NULL DEFAULT 1,
    xp INT NOT NULL DEFAULT 0,
    progress_map JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_progress_child ON public.kids_progress(child_profile_id);

ALTER TABLE public.kids_progress ENABLE ROW LEVEL SECURITY;

-- Parents can manage progress for their children
CREATE POLICY "Parents can view own children progress"
    ON public.kids_progress FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert progress for own children"
    ON public.kids_progress FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update progress for own children"
    ON public.kids_progress FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- Rewards earned by children
CREATE TABLE IF NOT EXISTS public.kids_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    reward_type TEXT NOT NULL,
    reward_data JSONB NOT NULL DEFAULT '{}',
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rewards_child ON public.kids_rewards(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_rewards_type ON public.kids_rewards(reward_type);

ALTER TABLE public.kids_rewards ENABLE ROW LEVEL SECURITY;

-- Parents can manage rewards for their children
CREATE POLICY "Parents can view own children rewards"
    ON public.kids_rewards FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert rewards for own children"
    ON public.kids_rewards FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

-- Daily missions per child per day
CREATE TABLE IF NOT EXISTS public.kids_daily_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_profile_id UUID NOT NULL REFERENCES public.kids_child_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    missions JSONB NOT NULL DEFAULT '[]',
    completed JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (child_profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_missions_child ON public.kids_daily_missions(child_profile_id);
CREATE INDEX IF NOT EXISTS idx_daily_missions_date ON public.kids_daily_missions(date);

ALTER TABLE public.kids_daily_missions ENABLE ROW LEVEL SECURITY;

-- Parents can manage daily missions for their children
CREATE POLICY "Parents can view own children daily missions"
    ON public.kids_daily_missions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can insert daily missions for own children"
    ON public.kids_daily_missions FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );

CREATE POLICY "Parents can update daily missions for own children"
    ON public.kids_daily_missions FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.kids_child_profiles cp
            WHERE cp.id = child_profile_id AND cp.parent_id = auth.uid()
        )
    );
