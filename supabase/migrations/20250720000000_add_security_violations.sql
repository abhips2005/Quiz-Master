-- Add security violations tracking table
CREATE TABLE IF NOT EXISTS security_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  violation_type text NOT NULL CHECK (violation_type IN ('tab_switch', 'keyboard_shortcut', 'right_click', 'devtools', 'copy_paste', 'suspicious_activity')),
  violation_count integer NOT NULL DEFAULT 1,
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high')) DEFAULT 'low',
  detected_at timestamptz DEFAULT now(),
  user_agent text,
  additional_data jsonb DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE security_violations ENABLE ROW LEVEL SECURITY;

-- Policies for security violations
CREATE POLICY "Teachers can view all violations for their sessions" ON security_violations
  FOR SELECT USING (
    session_id IN (
      SELECT id FROM game_sessions WHERE teacher_id = auth.uid()
    )
  );

CREATE POLICY "System can insert violations" ON security_violations
  FOR INSERT WITH CHECK (true);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_security_violations_session_id ON security_violations(session_id);
CREATE INDEX IF NOT EXISTS idx_security_violations_participant_id ON security_violations(participant_id);
CREATE INDEX IF NOT EXISTS idx_security_violations_severity ON security_violations(severity);
