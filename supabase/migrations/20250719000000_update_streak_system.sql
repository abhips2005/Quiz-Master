-- Update streak system to properly track overall user streaks
-- This migration improves the streak tracking and adds badge integration

-- Add a highest_streak column to track the user's best streak ever
ALTER TABLE users ADD COLUMN IF NOT EXISTS highest_streak integer DEFAULT 0;

-- Create function to update overall user streak and stats
CREATE OR REPLACE FUNCTION update_user_overall_stats()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  participant_record RECORD;
  current_user_streak INTEGER;
  is_correct BOOLEAN;
BEGIN
  -- Get participant details
  SELECT * INTO participant_record FROM participants WHERE id = NEW.participant_id;
  
  -- Get user details
  SELECT * INTO user_record FROM users WHERE id = participant_record.user_id;
  
  -- Check if the answer is correct
  is_correct := NEW.is_correct;
  
  -- Update user total points and level
  UPDATE users 
  SET 
    total_points = total_points + NEW.points_earned,
    level = GREATEST(1, (total_points + NEW.points_earned) / 1000 + 1)
  WHERE id = participant_record.user_id;
  
  -- Update overall user streak based on the current answer
  IF is_correct THEN
    -- Increment overall user streak
    UPDATE users 
    SET 
      streak = streak + 1,
      highest_streak = GREATEST(highest_streak, streak + 1)
    WHERE id = participant_record.user_id;
  ELSE
    -- Reset overall user streak
    UPDATE users 
    SET streak = 0
    WHERE id = participant_record.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update the trigger to use the new function
DROP TRIGGER IF EXISTS update_user_stats_trigger ON answers;
CREATE TRIGGER update_user_overall_stats_trigger
  AFTER INSERT ON answers
  FOR EACH ROW
  EXECUTE FUNCTION update_user_overall_stats();

-- Create function to handle game completion and badge checking
CREATE OR REPLACE FUNCTION handle_game_completion()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
  total_questions INTEGER;
  user_game_count INTEGER;
BEGIN
  -- Only process when game session is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Get all participants for this session
    FOR participant_record IN 
      SELECT p.*, u.id as user_id 
      FROM participants p 
      JOIN users u ON p.user_id = u.id 
      WHERE p.session_id = NEW.id
    LOOP
      -- Get total questions in the quiz
      SELECT COUNT(*) INTO total_questions 
      FROM questions 
      WHERE quiz_id = NEW.quiz_id;
      
      -- Get user's total game count
      SELECT COUNT(DISTINCT p.session_id) INTO user_game_count
      FROM participants p
      JOIN game_sessions gs ON p.session_id = gs.id
      WHERE p.user_id = participant_record.user_id
      AND gs.status = 'completed';
      
      -- Check if user got perfect score (all correct answers)
      IF participant_record.correct_answers = total_questions AND total_questions > 0 THEN
        -- This will be handled by the frontend badge checking system
        -- We could add a notification here or trigger an event
        NULL;
      END IF;
      
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for game completion
CREATE TRIGGER handle_game_completion_trigger
  AFTER UPDATE ON game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION handle_game_completion();

-- Add index for better performance on streak queries
CREATE INDEX IF NOT EXISTS idx_users_streak ON users(streak DESC);
CREATE INDEX IF NOT EXISTS idx_users_highest_streak ON users(highest_streak DESC);
CREATE INDEX IF NOT EXISTS idx_participants_streak ON participants(streak DESC);
