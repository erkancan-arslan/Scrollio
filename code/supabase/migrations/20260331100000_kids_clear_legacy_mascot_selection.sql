-- Children still pointing at removed mascot slugs (e.g. monster_*) would see an empty mascot-filtered feed.
-- Clear invalid selections so the feed falls back to no character filter until they pick bird, cat, or dragon again.

UPDATE public.kids_child_profiles
SET selected_character_id = NULL
WHERE selected_character_id IS NOT NULL
  AND selected_character_id NOT IN ('bird', 'cat', 'dragon');
