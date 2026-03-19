-- traces テーブル（機能トレースのキャッシュ）
CREATE TABLE traces (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usecase_id       UUID NOT NULL REFERENCES usecases(id) ON DELETE CASCADE,
  project_zip_hash TEXT NOT NULL,
  related_files    JSONB NOT NULL,
  -- [{path, role, keyLines: [18, 24]}]
  flow             JSONB NOT NULL,
  -- [{step, label, description, file, line}]
  explanation      TEXT NOT NULL,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usecase_id, project_zip_hash)
);

-- RLS
ALTER TABLE traces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "traces: own data only" ON traces FOR ALL
  USING (
    usecase_id IN (
      SELECT u.id FROM usecases u
      JOIN projects p ON p.id = u.project_id
      WHERE p.user_id = auth.uid()
    )
  );

-- インデックス
CREATE INDEX idx_traces_usecase_hash ON traces(usecase_id, project_zip_hash);
