-- Migrate preferences: replace flat contentDifficulty with per-topic topicDifficulties.
--
-- Before: { "contentDifficulty": "beginner", "preferredTopics": [...], ... }
-- After:  { "topicDifficulties": { "<topic>": "beginner", ... }, "preferredTopics": [...], ... }
--
-- For existing rows the previous global difficulty is applied to every preferred topic
-- so no data is lost. New rows use the updated column default.

-- 1. Update column default
ALTER TABLE public.profiles
  ALTER COLUMN preferences
  SET DEFAULT '{
    "notifications": true,
    "darkMode": false,
    "autoPlay": true,
    "topicDifficulties": {},
    "preferredTopics": []
  }'::jsonb;

-- 2. Migrate existing rows
--    a) Build topicDifficulties from existing preferredTopics + contentDifficulty
--    b) Remove the old contentDifficulty key
UPDATE public.profiles
SET preferences = (
  -- Start with current preferences
  preferences

  -- Remove the old flat key
  - 'contentDifficulty'

  -- Add topicDifficulties: map each preferred topic to the previous global difficulty
  || jsonb_build_object(
       'topicDifficulties',
       COALESCE(
         (
           SELECT jsonb_object_agg(
             topic_id,
             COALESCE(preferences->>'contentDifficulty', 'beginner')
           )
           FROM jsonb_array_elements_text(
             COALESCE(preferences->'preferredTopics', '[]'::jsonb)
           ) AS topic_id
         ),
         '{}'::jsonb
       )
     )
)
WHERE preferences IS NOT NULL;
