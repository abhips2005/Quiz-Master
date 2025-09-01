-- Fix for missing current_question_index column in participants table
-- This script adds the individual question progress tracking

-- Add current_question_index column to track individual progress
ALTER TABLE participants
ADD COLUMN IF NOT EXISTS current_question_index integer DEFAULT 0;

-- Add index for better performance on individual progress queries
CREATE INDEX IF NOT EXISTS idx_participants_current_question ON participants(current_question_index);

-- Update existing participants to have current_question_index = 0
UPDATE participants
SET current_question_index = 0
WHERE current_question_index IS NULL;

-- Function to get individual player's current question
CREATE OR REPLACE FUNCTION get_player_current_question(participant_uuid uuid)
RETURNS TABLE (
  question_index integer,
  question_id uuid,
  question_text text,
  options text[],
  correct_answer integer,
  points integer,
  time_limit integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.current_question_index,
    q.id,
    q.question,
    q.options,
    q.correct_answer,
    q.points,
    q.time_limit
  FROM participants p
  JOIN game_sessions gs ON p.session_id = gs.id
  JOIN quizzes quiz ON gs.quiz_id = quiz.id
  JOIN questions q ON quiz.id = q.quiz_id AND q.order_index = p.current_question_index
  WHERE p.id = participant_uuid
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_player_current_question(uuid) TO authenticated;

-- Verify the column was added
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'participants' AND column_name = 'current_question_index';
