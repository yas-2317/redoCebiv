-- ============================================================
-- 008_traces_unique.sql
-- traces テーブルに UNIQUE 制約を追加（重複挿入防止）
-- ============================================================

-- 既存の重複レコードを削除（古い方を残す）
DELETE FROM traces t1
USING traces t2
WHERE t1.usecase_id = t2.usecase_id
  AND t1.project_zip_hash = t2.project_zip_hash
  AND t1.id > t2.id;

-- UNIQUE 制約を追加
ALTER TABLE traces
  ADD CONSTRAINT traces_usecase_zip_unique
  UNIQUE (usecase_id, project_zip_hash);
