-- Function to get unique weekly leaderboard
-- Returns the single best score for each user within the last 7 days
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(
  p_game_type game_type,
  p_limit integer DEFAULT 100
)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  score integer,
  created_at timestamptz,
  display_name text,
  avatar_url text
) AS $$
DECLARE
  one_week_ago timestamptz;
BEGIN
  one_week_ago := NOW() - INTERVAL '7 days';

  RETURN QUERY
  WITH best_scores AS (
    SELECT DISTINCT ON (gs.user_id)
      gs.user_id,
      gs.score,
      gs.started_at as created_at
    FROM game_sessions gs
    WHERE gs.game_type = p_game_type
      AND gs.started_at >= one_week_ago
    ORDER BY gs.user_id, gs.score DESC
  )
  SELECT
    params.rank,
    params.user_id,
    params.score,
    params.created_at,
    p.display_name,
    p.avatar_url
  FROM (
      SELECT
        ROW_NUMBER() OVER (ORDER BY bs.score DESC) as rank,
        bs.user_id,
        bs.score,
        bs.created_at
      FROM best_scores bs
      ORDER BY bs.score DESC
      LIMIT p_limit
  ) params
  LEFT JOIN profiles p ON p.id = params.user_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
