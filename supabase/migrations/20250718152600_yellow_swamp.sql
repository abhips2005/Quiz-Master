/*
  # Live Quiz Platform Database Schema

  1. New Tables
    - `users` - User profiles with gamification data (points, streaks, levels)
    - `quizzes` - Quiz definitions created by teachers
    - `questions` - Individual questions belonging to quizzes
    - `game_sessions` - Live quiz sessions with PINs
    - `participants` - Students who joined game sessions
    - `answers` - Student answers to questions
    - `badges` - Achievement badges available in the system
    - `achievements` - User badge achievements

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Separate teacher/student access controls

  3. Features
    - Real-time subscriptions for live gameplay
    - Automatic point calculation and streak tracking
    - Badge system for achievements
    - Leaderboard functionality
*/

-- Create users table with gamification features
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('teacher', 'student')) DEFAULT 'student',
  name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  total_points integer DEFAULT 0,
  streak integer DEFAULT 0,
  level integer DEFAULT 1
);

-- Create quizzes table
CREATE TABLE IF NOT EXISTS quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
  category text NOT NULL DEFAULT 'General',
  time_limit integer NOT NULL DEFAULT 30,
  is_active boolean DEFAULT true
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  options text[] NOT NULL,
  correct_answer integer NOT NULL,
  explanation text DEFAULT '',
  points integer NOT NULL DEFAULT 100,
  time_limit integer NOT NULL DEFAULT 30,
  order_index integer NOT NULL DEFAULT 0,
  type text NOT NULL CHECK (type IN ('multiple_choice', 'true_false', 'short_answer')) DEFAULT 'multiple_choice'
);

-- Create game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pin text UNIQUE NOT NULL,
  status text NOT NULL CHECK (status IN ('waiting', 'active', 'completed')) DEFAULT 'waiting',
  current_question integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  started_at timestamptz,
  ended_at timestamptz,
  settings jsonb DEFAULT '{
    "show_leaderboard": true,
    "allow_powerups": true,
    "shuffle_questions": false,
    "show_correct_answers": true,
    "time_pressure": true,
    "bonus_points": true
  }'::jsonb
);

-- Create participants table
CREATE TABLE IF NOT EXISTS participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  nickname text NOT NULL,
  score integer DEFAULT 0,
  correct_answers integer DEFAULT 0,
  streak integer DEFAULT 0,
  position integer DEFAULT 0,
  join_time timestamptz DEFAULT now(),
  is_active boolean DEFAULT true
);

-- Create answers table
CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  answer text NOT NULL,
  is_correct boolean DEFAULT false,
  time_taken integer NOT NULL,
  points_earned integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create badges table for gamification
CREATE TABLE IF NOT EXISTS badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  rarity text NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')) DEFAULT 'common',
  requirement text NOT NULL,
  points_value integer DEFAULT 0
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at timestamptz DEFAULT now(),
  context text DEFAULT '',
  UNIQUE(user_id, badge_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Allow reading user names in game sessions"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Allow reading names of users who are participants in sessions the current user has access to
    EXISTS (
      SELECT 1 FROM participants p
      INNER JOIN game_sessions gs ON p.session_id = gs.id
      WHERE p.user_id = users.id
      AND (
        -- Teacher can see participants in their sessions
        gs.teacher_id = auth.uid()
        OR
        -- Participants can see other participants in same sessions
        EXISTS (
          SELECT 1 FROM participants p2 
          WHERE p2.session_id = gs.id 
          AND p2.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Quizzes policies
CREATE POLICY "Teachers can manage own quizzes"
  ON quizzes FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can read active quizzes"
  ON quizzes FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Questions policies
CREATE POLICY "Teachers can manage questions for own quizzes"
  ON questions FOR ALL
  TO authenticated
  USING (
    quiz_id IN (
      SELECT id FROM quizzes WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can read questions during active games"
  ON questions FOR SELECT
  TO authenticated
  USING (
    quiz_id IN (
      SELECT quiz_id FROM game_sessions 
      WHERE status IN ('active', 'completed')
      AND id IN (
        SELECT session_id FROM participants 
        WHERE user_id = auth.uid() OR user_id IS NULL
      )
    )
  );

-- Game sessions policies
CREATE POLICY "Teachers can manage own game sessions"
  ON game_sessions FOR ALL
  TO authenticated
  USING (teacher_id = auth.uid());

CREATE POLICY "Students can read game sessions they joined"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT session_id FROM participants 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

-- Participants policies
CREATE POLICY "Anyone can join game sessions"
  ON participants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Participants can read session participants"
  ON participants FOR SELECT
  TO authenticated
  USING (
    session_id IN (
      SELECT session_id FROM participants 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
    OR session_id IN (
      SELECT id FROM game_sessions 
      WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "Participants can update own data"
  ON participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Answers policies
CREATE POLICY "Participants can submit own answers"
  ON answers FOR INSERT
  TO authenticated
  WITH CHECK (
    participant_id IN (
      SELECT id FROM participants 
      WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );

CREATE POLICY "Users can read answers in their sessions"
  ON answers FOR SELECT
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM participants 
      WHERE session_id IN (
        SELECT session_id FROM participants 
        WHERE user_id = auth.uid() OR user_id IS NULL
      )
      OR session_id IN (
        SELECT id FROM game_sessions 
        WHERE teacher_id = auth.uid()
      )
    )
  );

-- Badges policies
CREATE POLICY "Everyone can read badges"
  ON badges FOR SELECT
  TO authenticated
  USING (true);

-- Achievements policies
CREATE POLICY "Users can read own achievements"
  ON achievements FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can award achievements"
  ON achievements FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quizzes_teacher_id ON quizzes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz_id ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_order ON questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_game_sessions_pin ON game_sessions(pin);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON game_sessions(status);
CREATE INDEX IF NOT EXISTS idx_participants_session_id ON participants(session_id);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON participants(user_id);
CREATE INDEX IF NOT EXISTS idx_answers_participant_id ON answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_answers_question_id ON answers(question_id);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

-- Insert default badges for gamification
INSERT INTO badges (name, description, icon, rarity, requirement, points_value) VALUES
('First Steps', 'Join your first quiz game', '🎯', 'common', 'Join 1 game', 50),
('Quick Draw', 'Answer a question in under 5 seconds', '⚡', 'common', 'Answer in <5s', 100),
('Perfect Score', 'Get 100% correct answers in a quiz', '💯', 'rare', '100% accuracy', 500),
('Speed Demon', 'Answer 10 questions in under 3 seconds each', '🏃', 'rare', '10 fast answers', 300),
('Streak Master', 'Get 10 correct answers in a row', '🔥', 'epic', '10 answer streak', 750),
('Quiz Champion', 'Win 5 quiz games', '👑', 'epic', 'Win 5 games', 1000),
('Knowledge Seeker', 'Participate in 50 quiz games', '📚', 'legendary', 'Play 50 games', 2000),
('Perfect Streak', 'Maintain a 25 answer streak', '⭐', 'legendary', '25 answer streak', 2500);

-- Create function to update user stats after game completion
CREATE OR REPLACE FUNCTION update_user_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user total points and level
  UPDATE users 
  SET 
    total_points = total_points + NEW.points_earned,
    level = GREATEST(1, (total_points + NEW.points_earned) / 1000 + 1)
  WHERE id = (
    SELECT user_id FROM participants WHERE id = NEW.participant_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stats updates
CREATE TRIGGER update_user_stats_trigger
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats();

-- Create function to calculate answer correctness and points
CREATE OR REPLACE FUNCTION process_answer()
RETURNS TRIGGER AS $$
DECLARE
  question_record RECORD;
  is_answer_correct BOOLEAN;
  earned_points INTEGER;
  speed_bonus FLOAT;
BEGIN
  -- Get question details
  SELECT * INTO question_record FROM questions WHERE id = NEW.question_id;
  
  -- Check if answer is correct
  is_answer_correct := NEW.answer::integer = question_record.correct_answer;
  
  -- Calculate points
  earned_points := 0;
  IF is_answer_correct THEN
    -- Base points with speed bonus
    speed_bonus := GREATEST(0, (question_record.time_limit - NEW.time_taken)::FLOAT / question_record.time_limit * 0.5);
    earned_points := ROUND(question_record.points * (1 + speed_bonus));
  END IF;
  
  -- Update the answer record
  NEW.is_correct := is_answer_correct;
  NEW.points_earned := earned_points;
  
  -- Update participant stats
  UPDATE participants 
  SET 
    score = score + earned_points,
    correct_answers = correct_answers + CASE WHEN is_answer_correct THEN 1 ELSE 0 END,
    streak = CASE WHEN is_answer_correct THEN streak + 1 ELSE 0 END
  WHERE id = NEW.participant_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic answer processing
CREATE TRIGGER process_answer_trigger
  BEFORE INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION process_answer();