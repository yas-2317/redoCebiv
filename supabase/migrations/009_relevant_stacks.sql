-- ============================================================
-- 009_relevant_stacks.sql
-- usecases テーブルに relevant_stacks カラムを追加
-- ============================================================

ALTER TABLE usecases
  ADD COLUMN IF NOT EXISTS relevant_stacks text[] NOT NULL DEFAULT '{}';
