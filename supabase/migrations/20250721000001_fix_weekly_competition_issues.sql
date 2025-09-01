-- Fix weekly competition system issues
-- This migration fixes the type mismatch in the cumulative leaderboard function
-- and ensures proper RLS policies are in place

-- Drop and recreate the cumulative leaderboard function with correct types
DROP FUNCTION IF EXISTS get_cumulative_leaderboard(integer);

CREATE OR REPLACE FUNCTION get_cumulative_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  user_name text,
  total_score integer,
  weeks_participated integer,
  best_weekly_score integer,
  average_weekly_score numeric,
  rank bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.user_id,
    u.name as user_name,
    cs.total_cumulative_score as total_score,
    cs.weeks_participated,
    cs.best_weekly_score,
    cs.average_weekly_score,
    ROW_NUMBER() OVER (ORDER BY cs.total_cumulative_score DESC) as rank
  FROM cumulative_scores cs
  JOIN users u ON cs.user_id = u.id
  ORDER BY cs.total_cumulative_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Ensure RLS is properly configured
ALTER TABLE weekly_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cumulative_scores ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can read active competitions" ON weekly_competitions;
DROP POLICY IF EXISTS "Teachers can manage competitions" ON weekly_competitions;
DROP POLICY IF EXISTS "Users can read their own weekly scores" ON weekly_scores;
DROP POLICY IF EXISTS "Users can read weekly scores for competitions they participated in" ON weekly_scores;
DROP POLICY IF EXISTS "System can insert/update weekly scores" ON weekly_scores;
DROP POLICY IF EXISTS "Users can read their own cumulative scores" ON cumulative_scores;
DROP POLICY IF EXISTS "Anyone can read cumulative leaderboard" ON cumulative_scores;

-- Recreate RLS policies with proper permissions
CREATE POLICY "Anyone can read active competitions"
  ON weekly_competitions FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Teachers can manage competitions"
  ON weekly_competitions FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'teacher'
  ));

CREATE POLICY "Users can read their own weekly scores"
  ON weekly_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read weekly scores for competitions they participated in"
  ON weekly_scores FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM weekly_scores ws2 
    WHERE ws2.competition_id = weekly_scores.competition_id 
    AND ws2.user_id = auth.uid()
  ));

CREATE POLICY "System can insert/update weekly scores"
  ON weekly_scores FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Users can read their own cumulative scores"
  ON cumulative_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Anyone can read cumulative leaderboard"
  ON cumulative_scores FOR SELECT
  TO authenticated
  USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON weekly_competitions TO authenticated;
GRANT ALL ON weekly_scores TO authenticated;
GRANT ALL ON cumulative_scores TO authenticated;

-- Ensure the function is accessible
GRANT EXECUTE ON FUNCTION get_cumulative_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_weekly_leaderboard(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_weekly_rankings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_cumulative_scores() TO authenticated;

-- Test the function to ensure it works
-- This will help identify any remaining issues
SELECT get_cumulative_leaderboard(5);
