-- Kids character selection: child profile stores selected monster; content can be tagged by character.
-- Run this in Supabase SQL Editor (or via supabase db push) before using the character selection feature.

-- 7.1 Çocuk profiline karakter alanı
ALTER TABLE public.kids_child_profiles
ADD COLUMN IF NOT EXISTS selected_character_id TEXT;

COMMENT ON COLUMN public.kids_child_profiles.selected_character_id IS 'One of monster_1..monster_6; NULL until child picks a character.';

-- 7.2 İçeriğe karakter alanı (ileride feed filtresi için)
ALTER TABLE public.kids_content
ADD COLUMN IF NOT EXISTS character_id TEXT;

COMMENT ON COLUMN public.kids_content.character_id IS 'monster_1..monster_6; which character narrates this video.';
