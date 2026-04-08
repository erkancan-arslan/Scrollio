-- Kids: explicit topic-interest onboarding (aligns with Core min-3 topics).
-- Tracks when a child has completed the onboarding step; used to gate MainTabs.

ALTER TABLE public.kids_child_profiles
  ADD COLUMN IF NOT EXISTS topic_onboarding_completed_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.kids_child_profiles.topic_onboarding_completed_at IS
  'Set when the child has saved at least 3 topics (onboarding or settings). NULL means show topic onboarding before main app.';

-- Existing profiles that already have 3+ topic rows (e.g. legacy auto-assigned topics) are treated as onboarded.
UPDATE public.kids_child_profiles p
SET topic_onboarding_completed_at = NOW()
WHERE p.topic_onboarding_completed_at IS NULL
  AND (
    SELECT COUNT(*)::int
    FROM public.kids_child_topics k
    WHERE k.child_profile_id = p.id
  ) >= 3;
