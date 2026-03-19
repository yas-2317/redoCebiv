-- ============================================================
-- 001_initial.sql
-- Phase 1: profiles + credit_transactions + 認証トリガー
-- ============================================================

-- profiles テーブル
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name        TEXT NOT NULL,
  plan                TEXT NOT NULL DEFAULT 'free'
                        CHECK (plan IN ('free', 'lite', 'team')),
  credit_balance      INTEGER NOT NULL DEFAULT 0 CHECK (credit_balance >= 0),
  welcome_bonus_given BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- credit_transactions テーブル
CREATE TABLE credit_transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount       INTEGER NOT NULL,  -- 正: 付与, 負: 消費
  action_type  TEXT NOT NULL
                 CHECK (action_type IN (
                   'welcome_bonus',
                   'monthly_grant',
                   'initial_analysis',
                   'trace_generate',
                   'change_proposal',
                   'challenge_grade',
                   'manual_adjustment'
                 )),
  project_id   UUID,  -- Phase 2 で FK 追加
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のデータのみ参照・更新
CREATE POLICY "profiles: select own"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- credit_transactions: 自分のデータのみ参照
CREATE POLICY "credit_transactions: select own"
  ON credit_transactions FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================
-- クレジット消費関数（アトミック処理）
-- ============================================================

CREATE OR REPLACE FUNCTION consume_credits(
  p_user_id    UUID,
  p_amount     INTEGER,
  p_action     TEXT,
  p_project_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  -- 悲観ロックで残高を取得
  SELECT credit_balance INTO v_balance
  FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF v_balance < p_amount THEN
    RETURN FALSE;  -- 残高不足
  END IF;

  -- 残高を減算
  UPDATE profiles
  SET credit_balance = credit_balance - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- 履歴を記録
  INSERT INTO credit_transactions (user_id, amount, action_type, project_id)
  VALUES (p_user_id, -p_amount, p_action, p_project_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- サインアップトリガー: profiles 自動作成 + ウェルカムボーナス付与
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, credit_balance, welcome_bonus_given)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    15,
    TRUE
  );

  INSERT INTO credit_transactions (user_id, amount, action_type)
  VALUES (NEW.id, 15, 'welcome_bonus');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
