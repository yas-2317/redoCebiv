-- usecasesにcategory列追加
ALTER TABLE usecases
  ADD COLUMN category TEXT NOT NULL DEFAULT 'other';

-- projectsにlast_activity_at列追加
ALTER TABLE projects
  ADD COLUMN last_activity_at TIMESTAMPTZ;

-- trace生成時にlast_activity_atを更新
CREATE OR REPLACE FUNCTION update_project_activity_from_trace()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET last_activity_at = NOW()
  WHERE id = (
    SELECT project_id FROM usecases WHERE id = NEW.usecase_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_trace_update_activity
  AFTER INSERT ON traces
  FOR EACH ROW EXECUTE FUNCTION update_project_activity_from_trace();

-- challenge提出時にlast_activity_atを更新
CREATE OR REPLACE FUNCTION update_project_activity_from_submission()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET last_activity_at = NOW()
  WHERE id = (
    SELECT project_id FROM challenges WHERE id = NEW.challenge_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_submission_update_activity
  AFTER INSERT ON challenge_submissions
  FOR EACH ROW EXECUTE FUNCTION update_project_activity_from_submission();
