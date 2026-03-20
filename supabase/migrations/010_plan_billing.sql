-- ============================================================
-- 010_plan_billing.sql
-- 1. profiles.plan enum を wanderer/tracer/navigator に変更
-- 2. challenges に format カラムを追加
-- 3. challenge_submissions に selected_index カラムを追加
-- ============================================================

-- 1. plan enum 変更
ALTER TABLE profiles DROP CONSTRAINT profiles_plan_check;
UPDATE profiles SET plan = 'wanderer' WHERE plan = 'free';
UPDATE profiles SET plan = 'tracer'   WHERE plan = 'lite';
UPDATE profiles SET plan = 'navigator' WHERE plan = 'team';
ALTER TABLE profiles ALTER COLUMN plan SET DEFAULT 'wanderer';
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('wanderer', 'tracer', 'navigator'));

-- 2. challenges に format カラムを追加
ALTER TABLE challenges
  ADD COLUMN IF NOT EXISTS format TEXT NOT NULL DEFAULT 'file_selection'
  CHECK (format IN ('file_selection', 'code_choice'));

-- difficulty を 1-5 に拡張（既存の CHECK 制約があれば付け替え）
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_difficulty_check;
ALTER TABLE challenges ADD CONSTRAINT challenges_difficulty_check
  CHECK (difficulty BETWEEN 1 AND 5);

-- 3. challenge_submissions に selected_index カラムを追加
ALTER TABLE challenge_submissions
  ADD COLUMN IF NOT EXISTS selected_index INTEGER;
