-- Phase 2: projects / project_files / usecases / challenges

-- ============================================================
-- projects
-- ============================================================
CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  stack            TEXT[] NOT NULL DEFAULT '{}',
  status           TEXT NOT NULL DEFAULT 'uploading'
                     CHECK (status IN ('uploading', 'analyzing', 'ready', 'error')),
  error_message    TEXT,
  file_count       INTEGER,
  zip_storage_path TEXT,
  zip_hash         TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects: own data only"
  ON projects FOR ALL
  USING (user_id = auth.uid());

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- ============================================================
-- project_files
-- ============================================================
CREATE TABLE project_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,
  content     TEXT NOT NULL,
  language    TEXT,
  size_bytes  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, path)
);

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_files: own data only"
  ON project_files FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE INDEX idx_project_files_project_id ON project_files(project_id);

-- ============================================================
-- usecases
-- ============================================================
CREATE TABLE usecases (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  description          TEXT NOT NULL,
  related_file_paths   TEXT[] NOT NULL DEFAULT '{}',
  display_order        INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usecases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usecases: own data only"
  ON usecases FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE INDEX idx_usecases_project_id ON usecases(project_id);

-- ============================================================
-- challenges
-- ============================================================
CREATE TABLE challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  usecase_id   UUID REFERENCES usecases(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  type         TEXT NOT NULL
                 CHECK (type IN ('text_change', 'condition', 'validation', 'display')),
  difficulty   INTEGER NOT NULL CHECK (difficulty BETWEEN 1 AND 3),
  answer       JSONB NOT NULL,
  hint         TEXT,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges: own data only"
  ON challenges FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

CREATE INDEX idx_challenges_project_id ON challenges(project_id);

-- ============================================================
-- credit_transactions.project_id の外部キー制約を追加
-- (Phase 1 時点では projects テーブルが存在しなかったため)
-- ============================================================
ALTER TABLE credit_transactions
  ADD CONSTRAINT fk_credit_transactions_project
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
