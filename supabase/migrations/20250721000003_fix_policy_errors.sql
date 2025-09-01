-- Fix policy creation errors for simplified cumulative scoring system
-- This migration fixes the "policy already exists" errors

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read cumulative leaderboard" ON cumulative_scores;
DROP POLICY IF EXISTS "Users can read their own cumulative scores" ON cumulative_scores;
DROP POLICY IF EXISTS "Users can read their own session scores" ON session_scores;
DROP POLICY IF EXISTS "System can insert session scores" ON session_scores;

-- Recreate policies with proper checks
CREATE POLICY "Anyone can read cumulative leaderboard"
  ON cumulative_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can read their own cumulative scores"
  ON cumulative_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can read their own session scores"
  ON session_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert session scores"
  ON session_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Ensure all necessary permissions are granted
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON cumulative_scores TO authenticated;
GRANT ALL ON session_scores TO authenticated;
GRANT EXECUTE ON FUNCTION get_cumulative_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_session_history(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_cumulative_scores() TO authenticated;
