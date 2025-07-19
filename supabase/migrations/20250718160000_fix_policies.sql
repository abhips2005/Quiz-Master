-- Fix recursive policy issue in participants table

-- Drop the problematic policies
DROP POLICY IF EXISTS "Participants can read session participants" ON participants;
DROP POLICY IF EXISTS "Students can read game sessions they joined" ON game_sessions;

-- Create simpler policies that avoid recursion
CREATE POLICY "Participants can read all participants"
  ON participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Students can read all game sessions"
  ON game_sessions FOR SELECT
  TO authenticated
  USING (true);

-- Teachers already have their own policy for managing game sessions
