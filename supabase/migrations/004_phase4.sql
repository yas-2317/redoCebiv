-- change_proposals テーブル（変更候補クエリの結果）
CREATE TABLE change_proposals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  intent       TEXT NOT NULL,
  change_type  TEXT CHECK (change_type IN ('text', 'condition', 'validation', 'display')),
  difficulty   INTEGER CHECK (difficulty BETWEEN 1 AND 3),
  candidates   JSONB NOT NULL,
  -- [{file, line, codeSnippet, reason, changeType}]
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE change_proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "change_proposals: own data only" ON change_proposals FOR ALL
  USING (user_id = auth.uid());

-- インデックス
CREATE INDEX idx_change_proposals_project ON change_proposals(project_id, user_id);
