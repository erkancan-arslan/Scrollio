-- Intermediate image after upscaler (between reframer and image-to-video).

ALTER TABLE public.kids_custom_mascot_jobs
    ADD COLUMN IF NOT EXISTS upscaled_image_url TEXT;

COMMENT ON COLUMN public.kids_custom_mascot_jobs.portrait_9_16_image_url IS
    'Reframer output (e.g. 9:16 composition) before upscaler.';
COMMENT ON COLUMN public.kids_custom_mascot_jobs.upscaled_image_url IS
    'Upscaler output fed into image-to-video.';
