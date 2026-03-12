-- Deduplicated view of video views per user
-- Each row represents the most recent watch of a unique (user, video) pair
CREATE OR REPLACE VIEW user_watched_videos AS
SELECT
  user_id,
  video_id,
  MAX(created_at) AS watched_at,
  SUM(watch_duration) AS total_watch_duration,
  BOOL_OR(completed) AS completed,
  COUNT(*) AS view_count
FROM video_views
WHERE user_id IS NOT NULL
GROUP BY user_id, video_id;

-- Function: keep profiles.total_videos_watched and total_watch_time in sync
CREATE OR REPLACE FUNCTION sync_profile_watch_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    -- Always add the session's watch duration to the running total
    -- Increment unique-video counter only on the first view of each video
    UPDATE profiles
    SET
      total_watch_time = COALESCE(total_watch_time, 0) + COALESCE(NEW.watch_duration, 0),
      total_videos_watched = COALESCE(total_videos_watched, 0) + (
        CASE
          WHEN NOT EXISTS (
            SELECT 1 FROM video_views
            WHERE user_id = NEW.user_id
              AND video_id = NEW.video_id
              AND id != NEW.id
          ) THEN 1
          ELSE 0
        END
      )
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: fires after each row inserted into video_views
DROP TRIGGER IF EXISTS trg_increment_videos_watched ON video_views;
DROP TRIGGER IF EXISTS trg_sync_profile_watch_stats ON video_views;
CREATE TRIGGER trg_sync_profile_watch_stats
AFTER INSERT ON video_views
FOR EACH ROW
EXECUTE FUNCTION sync_profile_watch_stats();
