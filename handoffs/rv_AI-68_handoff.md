# rv_AI-68 ハンドオフ — Phase 2: プロジェクトアップロード + 初期解析

作成日: 2026-03-18
完了日: 2026-03-18
ステータス: Done
Linear: https://linear.app/ai-driven-workspace/issue/AI-68/rv-phase-2-プロジェクトアップロード-初期解析
ブランチ: `ychikama230617/ai-68-rv-phase-2-プロジェクトアップロード-初期解析`

## 実装時に判明した追加決定事項

| 項目 | 内容 |
|---|---|
| ZIPライブラリ | `unzipper` → `fflate` に変更（Turbopack の @aws-sdk 依存エラー回避） |
| Inngest ローカル設定 | `INNGEST_DEV=1` が必須。`INNGEST_EVENT_KEY=local`, `INNGEST_SIGNING_KEY=` で動作 |
| `/api/inngest` middleware除外 | middleware matcher に `api/inngest` を追加（未設定だと /login にリダイレクトされる） |
| Inngest v4 API | `createFunction` の引数は2つ。triggerは `triggers: [{ event: '...' }]` としてオプションオブジェクトに含める |
| Storage バケット名 | `project_zips`（ハイフンではなくアンダースコア） |
| Storage アップロード | service role クライアントを使用（RLSポリシー設定不要） |
| クレジット消費タイミング | アップロード成功後に消費（失敗時の消費を防止） |
| challenges.type 正規化 | AI出力のtype値をDB制約値にマッピングする処理を追加 |
| コスト削減（開発中） | ユースケース抽出: Sonnet → Haiku、トークン上限: 150k/80k → 60k/40k（$0.62 → ~$0.07）|

---

## 概要

ZIPをアップロードしてAIがコードを解析し、ユースケース一覧を表示するフローを実装する。
Phase 1（認証・基盤）の続き。

---

## このセッションで決定した設計

| 項目 | 決定内容 |
|---|---|
| ZIPサイズ上限 | **20MB**（node_modules除外を案内） |
| ユースケース抽出数 | **最大20件**（ページ/画面カバレッジ重視） |
| 多様性担保方法 | プロンプトで「異なるページ・画面を起点にして選ぶ」と指示（Case B） |
| 将来の拡張方針 | 全機能一覧からユーザーが「学びたいもの」を選択するUIに拡張予定 |

これらは設計書（`design/mvp-spec.md` / `design/ai-design.md` / `design/architecture.md`）に反映済み。

---

## 事前手動作業（実装前にユーザーが行うこと）

### 1. Supabase Storage バケット作成

Supabase ダッシュボード → Storage → New bucket
- 名前: `project-zips`
- Public: **OFF**（非公開）
- ファイルサイズ上限: 20MB

### 2. npm パッケージ追加（承認済み）

```bash
npm install unzipper @anthropic-ai/sdk
npm install --save-dev @types/unzipper
```

---

## 作成・変更ファイル一覧

### DBマイグレーション

| ファイル | 内容 |
|---|---|
| `supabase/migrations/002_phase2.sql` | projects / project_files / usecases / challenges テーブル + RLS + インデックス |

### lib

| ファイル | 内容 |
|---|---|
| `src/lib/zip/index.ts` | ZIP展開・フィルタリング・SHA256計算 |
| `src/lib/anthropic/client.ts` | Anthropic SDK初期化 |
| `src/lib/anthropic/analyze.ts` | ユースケース抽出プロンプト（Sonnet） |
| `src/lib/anthropic/challenge.ts` | 初期課題生成プロンプト（Haiku） |
| `src/lib/credits/index.ts` | `consumeCredits()` ラッパー（Supabase RPC呼び出し） |
| `src/lib/inngest/functions/analyze-project.ts` | メインInngestジョブ |

### API Routes

| ファイル | メソッド | 内容 |
|---|---|---|
| `src/app/api/projects/route.ts` | POST | プロジェクト作成・ZIPアップロード・Inngest起動 |
| `src/app/api/projects/[id]/route.ts` | GET | ステータスポーリング用 |

### Pages / Components

| ファイル | SC/CC | 内容 |
|---|---|---|
| `src/app/(app)/page.tsx` | SC | ホームをプロジェクト一覧表示に更新 |
| `src/app/(app)/projects/new/page.tsx` | CC | ZIPアップロード画面 |
| `src/app/(app)/projects/[id]/page.tsx` | SC | プロジェクト詳細（ユースケース一覧） |
| `src/components/project/ProjectUploadForm.tsx` | CC | ドラッグ&ドロップ + 進捗表示 |
| `src/components/project/AnalyzingStatus.tsx` | CC | ポーリング（3秒間隔）+ 完了後リダイレクト |
| `src/components/project/ProjectCard.tsx` | SC | ホーム用プロジェクトカード |
| `src/components/project/UsecaseList.tsx` | SC | ユースケース一覧 |

### Inngest登録更新

| ファイル | 変更内容 |
|---|---|
| `src/app/api/inngest/route.ts` | `functions: []` に `analyzeProject` を追加 |

---

## 実装詳細

### DBマイグレーション（002_phase2.sql）

```sql
-- projects テーブル
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

-- project_files テーブル
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

-- usecases テーブル
CREATE TABLE usecases (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id           UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  description          TEXT NOT NULL,
  related_file_paths   TEXT[] NOT NULL DEFAULT '{}',
  display_order        INTEGER NOT NULL DEFAULT 0,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- challenges テーブル
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

-- RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects: own data only" ON projects FOR ALL USING (user_id = auth.uid());

ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "project_files: own data only" ON project_files FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

ALTER TABLE usecases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usecases: own data only" ON usecases FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "challenges: own data only" ON challenges FOR ALL
  USING (project_id IN (SELECT id FROM projects WHERE user_id = auth.uid()));

-- インデックス
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_usecases_project_id ON usecases(project_id);
CREATE INDEX idx_challenges_project_id ON challenges(project_id);

-- credit_transactions の projects 外部キー（Phase 1 マイグレーションに不足している場合のみ追加）
-- ALTER TABLE credit_transactions ADD CONSTRAINT fk_credit_transactions_project
--   FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL;
```

> **注意**: `credit_transactions.project_id` は Phase 1 SQLに定義されているが、`projects` テーブルが存在しなかったため外部キー制約なしで作成されている可能性がある。Supabaseで確認して必要なら上記の ALTER を実行する。

---

### ZIPアップロードフロー

```
POST /api/projects (multipart/form-data: name, file)
  1. 認証確認
  2. ファイルバリデーション（.zip / 20MB以下）
  3. consumeCredits(userId, 5, 'initial_analysis') → 残高不足なら 402
  4. projects INSERT (status: 'uploading')
  5. Supabase Storage に保存: project-zips/{userId}/{projectId}/source.zip
  6. projects UPDATE (status: 'analyzing', zip_storage_path: ...)
  7. inngest.send({ name: 'project/analyze', data: { projectId } })
  8. 202 { projectId } を返す
```

---

### Inngestジョブ（analyze-project）

```
Step 1: ZIPダウンロード + ハッシュ計算
  - Supabase Storage から ZIP をダウンロード
  - SHA256ハッシュを計算 → projects.zip_hash に保存

Step 2: ZIP展開 + フィルタリング
  除外: node_modules/ / .git/ / .next/ / dist/ / build/
        *.lock / *.map / *.min.js / バイナリファイル
  → 残ったファイルを project_files に INSERT
  → projects.file_count を更新

Step 3: AI用ファイル選定
  優先: src/**/*.tsx, src/**/*.ts, app/**/*.tsx, app/**/*.ts
  次点: *.config.ts, tailwind.config.ts, package.json
  除外: *.test.ts, *.spec.ts, *.d.ts
  トークン推定（1文字 ≈ 0.5トークン）→ 150k超なら src/ 配下のみに絞る

Step 4: Claude Sonnet（claude-sonnet-4-6）でユースケース抽出
  - 最大20件
  - ページ/画面カバレッジ重視（プロンプトで指示）
  → usecases に INSERT

Step 5: Claude Haiku（claude-haiku-4-5-20251001）で初期課題生成
  - 難易度1×3件, 2×4件, 3×1件 = 計8件
  → challenges に INSERT

Step 6: 完了処理
  - projects UPDATE (status: 'ready', zip_storage_path: NULL)
  - Supabase Storage から ZIP を削除

エラー時:
  - projects UPDATE (status: 'error', error_message: ...)
  - Inngest 自動リトライ（最大3回）
```

---

### ポーリング設計

```typescript
// GET /api/projects/[id] → { status, name, ... } を返す
// AnalyzingStatus.tsx で3秒ごとにポーリング
// status === 'ready' → router.push(`/projects/${id}`)
// status === 'error' → エラーメッセージ表示
```

---

### UIの案内文

ZIPアップロード画面に以下を表示する：

```
⚠️ node_modules を除いてZIP化してください
例: zip -r app.zip . --exclude 'node_modules/*' '.git/*' '.next/*'
対応スタック: Next.js / React / TypeScript / Tailwind
上限: 20MB
```

---

## 完了条件

- [ ] `supabase/migrations/002_phase2.sql` を適用済み
- [ ] ZIPをアップロードすると解析が始まる（status: analyzing）
- [ ] 解析完了後にユースケース一覧が表示される（最大20件）
- [ ] Supabase Storage からZIPが削除されている
- [ ] クレジットが5cr消費されている（credit_transactions に記録）
- [ ] 解析中はポーリングUIが表示される
- [ ] ホームにプロジェクト一覧が表示される
- [ ] エラー時にエラーメッセージが表示される

---

## 参照設計書

- `design/ai-design.md` — プロンプト全文・パイプライン詳細
- `design/data-model.md` — テーブル定義・RLS・consume_credits関数
- `design/architecture.md` — フォルダ構成・SC/CC境界・Storage設定
- `design/mvp-spec.md` — 非機能要件・画面仕様・APIレスポンス形式
