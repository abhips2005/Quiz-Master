-- Add field to track which question each participant last answered
ALTER TABLE participants ADD COLUMN IF NOT EXISTS last_answered_question INTEGER DEFAULT -1;

-- This field will help us track auto-progression:
-- -1 = no question answered yet
-- 0 = answered question 1
-- 1 = answered question 2, etc.
