# redoCebiv — データモデル設計

最終更新: 2026-03-18

---

## エンティティ一覧

```
auth.users (Supabase Auth管理)
    │
    └── profiles ──── credit_transactions
          │
          ├── projects ──── project_files
          │      │
          │      ├── usecases ──── traces
          │      │
          │      └── challenges ──── challenge_submissions
          │                               │
          └── growth_records ←────────────┘
```

---

## テーブル定義

### profiles

ユーザープロフィールとクレジット残高を管理する。

```sql
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
```

| カラム | 説明 |
|---|---|
| plan | 'free' / 'lite' / 'team' |
| credit_balance | 現在のクレジット残高 |
| welcome_bonus_given | 初回15cr付与済みフラグ（重複付与防止） |

---

### credit_transactions

クレジットの増減履歴をすべて記録する。残高はここから計算可能（profiles.credit_balanceはキャッシュ）。

```sql
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
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  note         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| action_type | amount | 説明 |
|---|---|---|
| welcome_bonus | +15 | 初回サインアップ |
| monthly_grant | +5（Free）/+100（Lite） | 月次付与 |
| initial_analysis | -5 | ZIPアップロード・解析 |
| trace_generate | -1 | トレース初回生成（キャッシュヒット時は発生しない） |
| change_proposal | -2 | 変更候補クエリ |
| challenge_grade | -1 | 課題採点 |

---

### projects

アップロードされたプロジェクトのメタデータ。

```sql
CREATE TABLE projects (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  stack            TEXT[] NOT NULL DEFAULT '{}',  -- ['next.js', 'react', 'typescript']
  status           TEXT NOT NULL DEFAULT 'uploading'
                     CHECK (status IN ('uploading', 'analyzing', 'ready', 'error')),
  error_message    TEXT,
  file_count       INTEGER,
  zip_storage_path TEXT,   -- 解析完了後NULLにする
  zip_hash         TEXT,   -- SHA256。キャッシュ無効化に使用
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| カラム | 説明 |
|---|---|
| status | uploading → analyzing → ready / error |
| zip_storage_path | Supabase StorageのパスURL。解析後即NULL化して削除 |
| zip_hash | ZIPのSHA256ハッシュ。再アップロード検知とトレースキャッシュ無効化に使用 |

---

### project_files

プロジェクト内のファイル内容。AIに渡す元データ。

```sql
CREATE TABLE project_files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  path        TEXT NOT NULL,         -- 'components/AddTaskForm.tsx'
  content     TEXT NOT NULL,
  language    TEXT,                  -- 'typescript', 'tsx', 'css'
  size_bytes  INTEGER NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, path)
);
```

---

### usecases

AIが初期解析で抽出したユースケース一覧。

```sql
CREATE TABLE usecases (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,         -- 'タスクを追加する'
  description      TEXT NOT NULL,
  related_file_paths TEXT[] NOT NULL DEFAULT '{}',
  display_order    INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### traces

機能トレース結果のキャッシュ。zip_hashが変わるまで再利用する。

```sql
CREATE TABLE traces (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usecase_id      UUID NOT NULL REFERENCES usecases(id) ON DELETE CASCADE,
  project_zip_hash TEXT NOT NULL,   -- このhashが変わったらキャッシュ無効
  related_files   JSONB NOT NULL,
  -- [{path, role, keyLines: [18, 24]}]
  flow            JSONB NOT NULL,
  -- [{step, label, description, file, line}]
  explanation     TEXT NOT NULL,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (usecase_id, project_zip_hash)
);
```

**キャッシュロジック**:
1. `usecase_id` + `project_zip_hash` で検索
2. ヒット → そのまま返す（クレジット消費なし）
3. ミス → Claude Sonnet で生成 → INSERT → クレジット消費

---

### change_proposals

変更候補クエリの結果。再利用はしない（意図がユニーク）。

```sql
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
```

---

### challenges

プロジェクトに対して生成されたミニ改造課題。初回生成後はキャッシュ。

```sql
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
  -- {correctFiles: [], correctCode, explanation, changeType, relatedExamples: []}
  hint         TEXT,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active', 'archived')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

### challenge_submissions

ユーザーの課題回答と採点結果。

```sql
CREATE TABLE challenge_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id   UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id        UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_files TEXT[] NOT NULL DEFAULT '{}',
  answer_text    TEXT,
  used_hint      BOOLEAN NOT NULL DEFAULT FALSE,
  grade          TEXT NOT NULL
                   CHECK (grade IN ('self', 'with_hint', 'missed')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

| grade | 条件 |
|---|---|
| self | ファイル正解 + ヒントなし |
| with_hint | ファイル正解 + ヒントあり |
| missed | ファイル不正解 |

---

### growth_records

ユーザーの成長をスキル軸・項目ごとに記録する。同一スキル項目は最新gradeで上書き。

```sql
CREATE TABLE growth_records (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_axis              TEXT NOT NULL
                            CHECK (skill_axis IN ('read', 'predict', 'fix')),
  skill_item              TEXT NOT NULL,
  -- read: file_identification / event_tracking / state_tracking
  -- predict: text_change / condition_change / validation_change
  -- fix: ui_minor / validation_add
  grade                   TEXT NOT NULL
                            CHECK (grade IN ('self', 'with_hint', 'missed')),
  challenge_submission_id UUID REFERENCES challenge_submissions(id) ON DELETE SET NULL,
  achieved_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, skill_axis, skill_item)
  -- 同じ項目は最新状態で上書き（ON CONFLICT DO UPDATE）
);
```

---

## RLS（Row Level Security）方針

```sql
-- 全テーブルに対して基本方針:
-- SELECT: 自分のデータのみ
-- INSERT: 自分のuser_idでのみ
-- UPDATE: 自分のデータのみ
-- DELETE: 基本的に禁止（論理削除で対応）

-- 例: projects テーブル
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects: own data only"
  ON projects FOR ALL
  USING (user_id = auth.uid());
```

---

## インデックス方針

```sql
-- 頻繁に使うクエリに対するインデックス
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_usecases_project_id ON usecases(project_id);
CREATE INDEX idx_traces_usecase_hash ON traces(usecase_id, project_zip_hash);
CREATE INDEX idx_challenges_project_id ON challenges(project_id);
CREATE INDEX idx_challenge_submissions_user ON challenge_submissions(user_id, challenge_id);
CREATE INDEX idx_growth_records_user ON growth_records(user_id, skill_axis);
CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
```

---

## クレジット管理のトランザクション設計

クレジット消費は「残高チェック → 消費 → 記録」をアトミックに行う。

```sql
-- クレジット消費の関数
CREATE OR REPLACE FUNCTION consume_credits(
  p_user_id   UUID,
  p_amount    INTEGER,
  p_action    TEXT,
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
$$ LANGUAGE plpgsql;
```
