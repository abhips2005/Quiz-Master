-- Simplify cumulative scoring system - remove weekly constraints
-- This migration creates a simple cumulative score tracking system

-- Drop the complex weekly competition tables and functions
DROP TABLE IF EXISTS weekly_scores CASCADE;
DROP TABLE IF EXISTS weekly_competitions CASCADE;
DROP TABLE IF EXISTS cumulative_scores CASCADE;

-- Drop related functions
DROP FUNCTION IF EXISTS update_cumulative_scores() CASCADE;
DROP FUNCTION IF EXISTS calculate_weekly_rankings(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_cumulative_leaderboard(integer) CASCADE;
DROP FUNCTION IF EXISTS get_weekly_leaderboard(integer, integer) CASCADE;

-- Create a simple cumulative_scores table
CREATE TABLE IF NOT EXISTS cumulative_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_score integer NOT NULL DEFAULT 0,
  sessions_participated integer NOT NULL DEFAULT 0,
  best_session_score integer DEFAULT 0,
  average_session_score numeric(5,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create session_scores table to track individual session scores
CREATE TABLE IF NOT EXISTS session_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  session_score integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, session_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cumulative_scores_total_score ON cumulative_scores(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_session_scores_user_id ON session_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_session_scores_session_id ON session_scores(session_id);

-- Function to automatically update cumulative scores when session scores are added
CREATE OR REPLACE FUNCTION update_cumulative_scores()
RETURNS TRIGGER AS $$
DECLARE
  user_cumulative RECORD;
  total_score INTEGER;
  sessions_count INTEGER;
  avg_score NUMERIC;
  best_score INTEGER;
BEGIN
  -- Calculate new cumulative values
  SELECT 
    COALESCE(SUM(session_score), 0),
    COUNT(*),
    COALESCE(AVG(session_score), 0),
    COALESCE(MAX(session_score), 0)
  INTO total_score, sessions_count, avg_score, best_score
  FROM session_scores 
  WHERE user_id = NEW.user_id;
  
  -- Get current cumulative score for the user
  SELECT * INTO user_cumulative FROM cumulative_scores WHERE user_id = NEW.user_id;
  
  -- Insert or update cumulative scores
  IF user_cumulative IS NULL THEN
    INSERT INTO cumulative_scores (user_id, total_score, sessions_participated, best_session_score, average_session_score)
    VALUES (NEW.user_id, total_score, sessions_count, best_score, avg_score);
  ELSE
    UPDATE cumulative_scores 
    SET 
      total_score = total_score,
      sessions_participated = sessions_count,
      best_session_score = best_score,
      average_session_score = avg_score,
      last_updated = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update cumulative scores
CREATE TRIGGER update_cumulative_scores_trigger
  AFTER INSERT OR UPDATE ON session_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_cumulative_scores();

-- Function to get cumulative leaderboard
CREATE OR REPLACE FUNCTION get_cumulative_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  user_name text,
  total_score integer,
  sessions_participated integer,
  best_session_score integer,
  average_session_score numeric,
  rank bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.user_id,
    u.name as user_name,
    cs.total_score,
    cs.sessions_participated,
    cs.best_session_score,
    cs.average_session_score,
    ROW_NUMBER() OVER (ORDER BY cs.total_score DESC) as rank
  FROM cumulative_scores cs
  LEFT JOIN users u ON cs.user_id = u.id
  ORDER BY cs.total_score DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get user's session history
CREATE OR REPLACE FUNCTION get_user_session_history(user_uuid uuid, limit_count integer DEFAULT 10)
RETURNS TABLE (
  session_id uuid,
  session_score integer,
  created_at timestamptz,
  quiz_title text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.session_id,
    ss.session_score,
    ss.created_at,
    q.title as quiz_title
  FROM session_scores ss
  LEFT JOIN game_sessions gs ON ss.session_id = gs.id
  LEFT JOIN quizzes q ON gs.quiz_id = q.id
  WHERE ss.user_id = user_uuid
  ORDER BY ss.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE cumulative_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for cumulative_scores
DROP POLICY IF EXISTS "Anyone can read cumulative leaderboard" ON cumulative_scores;
CREATE POLICY "Anyone can read cumulative leaderboard"
  ON cumulative_scores FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can read their own cumulative scores" ON cumulative_scores;
CREATE POLICY "Users can read their own cumulative scores"
  ON cumulative_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- RLS policies for session_scores
DROP POLICY IF EXISTS "Users can read their own session scores" ON session_scores;
CREATE POLICY "Users can read their own session scores"
  ON session_scores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert session scores" ON session_scores;
CREATE POLICY "System can insert session scores"
  ON session_scores FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON cumulative_scores TO authenticated;
GRANT ALL ON session_scores TO authenticated;
GRANT EXECUTE ON FUNCTION get_cumulative_leaderboard(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_session_history(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION update_cumulative_scores() TO authenticated;
