-- Kids videos do not use difficulty tiers (unlike core batch beginner/intermediate/advanced).
-- Allow NULL on kids_content.difficulty for admin-generated and other non-tiered rows.
-- Legacy rows keep easy | medium | hard.

ALTER TABLE public.kids_content
    DROP CONSTRAINT IF EXISTS kids_content_difficulty_check;

ALTER TABLE public.kids_content
    ALTER COLUMN difficulty DROP NOT NULL;

ALTER TABLE public.kids_content
    ADD CONSTRAINT kids_content_difficulty_check
    CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard'));

COMMENT ON COLUMN public.kids_content.difficulty IS
    'Optional. NULL when content has no difficulty tier (e.g. admin-generated kids videos). Otherwise easy | medium | hard.';
