-- Document current mascot slugs (bird, cat, dragon). Does not change data.

COMMENT ON COLUMN public.kids_child_profiles.selected_character_id IS
    'Kids mascot: bird | cat | dragon — matches reference_videos.character_id; NULL until child picks.';

COMMENT ON COLUMN public.kids_content.character_id IS
    'Mascot id for this clip (bird, cat, dragon); must match child selected_character_id for feed filter.';

COMMENT ON COLUMN public.reference_videos.character_id IS
    'Kids base animation mascot: bird, cat, dragon — must match kids_child_profiles.selected_character_id for the same mascot.';
