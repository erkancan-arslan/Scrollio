-- Optional: add mentor generation result columns to kids_drawings
-- So we can store characterImageUrl and description when generate-mentor is used.

ALTER TABLE public.kids_drawings
  ADD COLUMN IF NOT EXISTS mentor_image_url TEXT,
  ADD COLUMN IF NOT EXISTS drawing_description TEXT;

COMMENT ON COLUMN public.kids_drawings.mentor_image_url IS 'URL of the FAL-generated Pixar-style character image';
COMMENT ON COLUMN public.kids_drawings.drawing_description IS 'Short label e.g. Pixar-style 3D character transformation';
