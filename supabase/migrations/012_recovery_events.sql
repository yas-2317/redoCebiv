CREATE TABLE recovery_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  usecase_id UUID REFERENCES usecases(id) ON DELETE SET NULL,
  challenge_id UUID REFERENCES challenges(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (
    event_type IN (
      'trace_generated',
      'challenge_self_solved',
      'challenge_solved_with_hint',
      'challenge_missed'
    )
  ),
  title TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE recovery_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recovery_events: own data only"
  ON recovery_events FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX idx_recovery_events_user_project_created_at
  ON recovery_events(user_id, project_id, created_at DESC);

CREATE INDEX idx_recovery_events_project_created_at
  ON recovery_events(project_id, created_at DESC);
