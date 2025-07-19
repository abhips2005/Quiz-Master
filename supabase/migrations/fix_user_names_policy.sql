-- Add policy to allow reading user names for game participants
-- This allows teachers and students to see participant names in game sessions they're part of

CREATE POLICY "Allow reading user names in game sessions"
  ON users FOR SELECT
  TO authenticated
  USING (
    -- Allow reading own profile
    auth.uid() = id
    OR
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
