-- Phase 5: challenge_submissions

CREATE TABLE challenge_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id   UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  project_id     UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_files TEXT[] NOT NULL DEFAULT '{}',
  answer_text    TEXT NOT NULL DEFAULT '',
  used_hint      BOOLEAN NOT NULL DEFAULT FALSE,
  grade          TEXT NOT NULL
                   CHECK (grade IN ('self', 'with_hint', 'missed')),
  explanation    TEXT NOT NULL DEFAULT '',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenge_submissions: own data only"
  ON challenge_submissions FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX idx_challenge_submissions_user_challenge
  ON challenge_submissions(user_id, challenge_id);
CREATE INDEX idx_challenge_submissions_project_id
  ON challenge_submissions(project_id);
