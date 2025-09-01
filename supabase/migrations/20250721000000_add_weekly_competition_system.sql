-- Add weekly competition system for cumulative leaderboard
-- This migration creates tables and functions to track weekly quiz scores

-- Create weekly_competitions table to track each week's competition
CREATE TABLE IF NOT EXISTS weekly_competitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  week_number integer NOT NULL UNIQUE,
  title text NOT NULL,
  description text DEFAULT '',
  start_date date NOT NULL,
  end_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create weekly_scores table to track individual scores for each week
CREATE TABLE IF NOT EXISTS weekly_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id uuid NOT NULL REFERENCES weekly_competitions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  weekly_score integer NOT NULL DEFAULT 0,
  weekly_rank integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(competition_id, user_id, session_id)
);

-- Create cumulative_scores table to track total scores across all weeks
CREATE TABLE IF NOT EXISTS cumulative_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_cumulative_score integer NOT NULL DEFAULT 0,
  weeks_participated integer NOT NULL DEFAULT 0,
  best_weekly_score integer DEFAULT 0,
  average_weekly_score numeric(5,2) DEFAULT 0,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_weekly_competitions_week_number ON weekly_competitions(week_number);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_competition_user ON weekly_scores(competition_id, user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_weekly_score ON weekly_scores(weekly_score DESC);
CREATE INDEX IF NOT EXISTS idx_cumulative_scores_total_score ON cumulative_scores(total_cumulative_score DESC);
CREATE INDEX IF NOT EXISTS idx_weekly_scores_rank ON weekly_scores(weekly_rank);

-- Function to automatically update cumulative scores when weekly scores are added/updated
CREATE OR REPLACE FUNCTION update_cumulative_scores()
RETURNS TRIGGER AS $$
DECLARE
  user_cumulative RECORD;
  total_score INTEGER;
  weeks_count INTEGER;
  avg_score NUMERIC;
  best_score INTEGER;
BEGIN
  -- Get current cumulative score for the user
  SELECT * INTO user_cumulative FROM cumulative_scores WHERE user_id = NEW.user_id;
  
  -- Calculate new cumulative values
  SELECT 
    COALESCE(SUM(weekly_score), 0),
    COUNT(*),
    COALESCE(AVG(weekly_score), 0),
    COALESCE(MAX(weekly_score), 0)
  INTO total_score, weeks_count, avg_score, best_score
  FROM weekly_scores 
  WHERE user_id = NEW.user_id;
  
  -- Insert or update cumulative scores
  IF user_cumulative IS NULL THEN
    INSERT INTO cumulative_scores (user_id, total_cumulative_score, weeks_participated, best_weekly_score, average_weekly_score)
    VALUES (NEW.user_id, total_score, weeks_count, best_score, avg_score);
  ELSE
    UPDATE cumulative_scores 
    SET 
      total_cumulative_score = total_score,
      weeks_participated = weeks_count,
      best_weekly_score = best_score,
      average_weekly_score = avg_score,
      last_updated = now()
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate weekly rankings
CREATE OR REPLACE FUNCTION calculate_weekly_rankings(comp_id uuid)
RETURNS void AS $$
BEGIN
  -- Update weekly rankings for the specified competition
  UPDATE weekly_scores 
  SET weekly_rank = subquery.rank
  FROM (
    SELECT 
      id,
      ROW_NUMBER() OVER (ORDER BY weekly_score DESC) as rank
    FROM weekly_scores 
    WHERE competition_id = comp_id
  ) as subquery
  WHERE weekly_scores.id = subquery.id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_cumulative_scores_trigger
  AFTER INSERT OR UPDATE ON weekly_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_cumulative_scores();

-- Function to get cumulative leaderboard
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

-- Function to get weekly leaderboard for a specific week
CREATE OR REPLACE FUNCTION get_weekly_leaderboard(week_num integer, limit_count integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  user_name text,
  weekly_score integer,
  weekly_rank integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ws.user_id,
    u.name as user_name,
    ws.weekly_score,
    ws.weekly_rank
  FROM weekly_scores ws
  JOIN users u ON ws.user_id = u.id
  JOIN weekly_competitions wc ON ws.competition_id = wc.id
  WHERE wc.week_number = week_num
  ORDER BY ws.weekly_rank ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Insert initial weekly competitions (12 weeks)
INSERT INTO weekly_competitions (week_number, title, start_date, end_date) VALUES
  (1, 'Week 1 - Getting Started', '2025-01-06', '2025-01-12'),
  (2, 'Week 2 - Building Momentum', '2025-01-13', '2025-01-19'),
  (3, 'Week 3 - Steady Progress', '2025-01-20', '2025-01-26'),
  (4, 'Week 4 - Midpoint Challenge', '2025-01-27', '2025-02-02'),
  (5, 'Week 5 - Pushing Forward', '2025-02-03', '2025-02-09'),
  (6, 'Week 6 - Halfway There', '2025-02-10', '2025-02-16'),
  (7, 'Week 7 - Steady Climb', '2025-02-17', '2025-02-23'),
  (8, 'Week 8 - Final Stretch', '2025-02-24', '2025-03-02'),
  (9, 'Week 9 - Almost There', '2025-03-03', '2025-03-09'),
  (10, 'Week 10 - Final Push', '2025-03-10', '2025-03-16'),
  (11, 'Week 11 - Championship Week', '2025-03-17', '2025-03-23'),
  (12, 'Week 12 - Grand Finale', '2025-03-24', '2025-03-30')
ON CONFLICT (week_number) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE weekly_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE cumulative_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies for weekly_competitions
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

-- RLS policies for weekly_scores
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

-- RLS policies for cumulative_scores
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
