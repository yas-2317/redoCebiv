# Phase B: 法的機構実装 ハンドオフ

## 概要

規約・PPに記載している動作保証（クレジット月次付与・データ自動削除・解約導線）を実際に動かすための実装フェーズ。
Phase A（法的ページ整備）完了後に着手する。

## スコープ

| # | タスク | 対象 | 優先度 |
|---|---|---|---|
| 1 | 月次クレジット自動付与（Inngest cron） | `src/lib/inngest/` + `supabase/migrations/` | 🔴 高 |
| 2 | サブスクリプション解約導線（Stripe実装まではサポート誘導） | `src/app/(app)/settings/page.tsx` | 🔴 高 |
| 3 | 30日コンテンツ自動削除（Inngest cron） | `src/lib/inngest/` + `supabase/migrations/` | 🟡 中 |
| 4 | アカウント削除機能 | `src/app/(app)/settings/page.tsx` + API | 🟡 中 |

---

## タスク詳細

### 1. 月次クレジット自動付与

**現状:** `monthly_grant` という action_type は DB に定義されているが、実際に毎月発火する仕組みがない。有料ユーザーが課金しても手動 admin 調整が必要な状態。

**実装方針:**

DB 側（migration 追加）:
```sql
-- grant_monthly_credits 関数
CREATE OR REPLACE FUNCTION grant_monthly_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET credit_balance = credit_balance + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (user_id, amount, action_type)
  VALUES (p_user_id, p_amount, 'monthly_grant');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Inngest 側（新規関数 `src/lib/inngest/functions/monthly-credits.ts`）:
- トリガー: Inngest の `cron/monthly-credit-grant` イベント（毎月1日 JST 9:00）
- 処理: `profiles` テーブルの全ユーザーを plan 別にバッチ処理
  - `wanderer`: 3 cr
  - `tracer`: 80 cr
  - `navigator`: 250 cr
- バッチサイズ: 100件ずつ（API rate limit 回避）

**注意点:**
- `credit_balance` に上限キャップ（wanderer は 30）を超えないように制御が必要か確認
- 初回付与済みかどうかの管理（重複付与防止）
- Inngest の cron 書式: `"0 0 1 * *"`（UTC 0:00 = JST 9:00）

---

### 2. サブスクリプション解約導線

**現状:** `settings/page.tsx` に「Upgrade」バッジはあるが解約 UI が存在しない。規約には「アカウント設定のサブスクリプション管理から解約できる」と記載している。

**Stripe 実装前の対応方針（暫定）:**

`settings/page.tsx` の「Plan & billing」セクションに追加:
- Wanderer（無料）の場合: 「Upgrade」ボタン（将来の Stripe 接続先）
- 有料プランの場合: 「解約はサポートへ」リンクを表示

```tsx
{planInfo.label !== 'Wanderer' && (
  <a href="https://yas-2317.github.io/redoCebiv/support.html" target="_blank" rel="noopener noreferrer"
     className="text-xs text-[var(--app-subtle)] underline">
    Cancel subscription
  </a>
)}
```

**Stripe 実装後（Phase B-2 拡張）:**
- Stripe Customer Portal を使った解約フロー
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` の環境変数追加（要承認）
- `profiles.stripe_customer_id` カラム追加

---

### 3. 30日コンテンツ自動削除

**現状:** ADR-013 で設計済みだが未実装。`last_accessed_at` カラムが `projects` テーブルに存在しない。

**DB 側（migration 追加）:**
```sql
-- projects テーブルに last_accessed_at を追加
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- last_accessed_at を更新するトリガー
-- または アプリ側で trace_generate / change_proposal / challenge_grade 時に更新
```

**アプリ側（last_accessed_at の更新タイミング）:**
- `src/lib/traces/service.ts` のトレース生成時
- `src/lib/proposals/service.ts` の変更候補生成時
- `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts` の課題採点時

**Inngest cron（新規関数 `src/lib/inngest/functions/cleanup-stale-projects.ts`）:**
- トリガー: 毎日 JST 3:00（`"0 18 * * *"` UTC）
- 処理: `projects.last_accessed_at < NOW() - INTERVAL '30 days'` の project_files を `content = NULL` に更新
- path は保持（Challenge のファイルツリーが壊れないように）
- バッチサイズ: 50件

**注意点:**
- `project_files` の RLS を確認（service role での操作が必要）
- 削除後にユーザーがトレースを再生成しようとしたとき、再アップロードを促すエラーメッセージが必要（[traces/service.ts](src/lib/traces/service.ts) で content = NULL を検知してエラーハンドリング）

---

### 4. アカウント削除機能

**現状:** `settings/page.tsx` にアカウント削除 UI がない。問い合わせフォームで手動対応が前提。

**実装方針:**

`settings/page.tsx` に「Danger zone」セクション追加:
- 「Delete account」ボタン → 確認モーダル表示
- 確認モーダル: 「メールアドレスを入力して確定」形式

API エンドポイント（新規 `src/app/api/account/delete/route.ts`）:
- `requireUser()` で認証確認
- Supabase Auth の `admin.deleteUser(userId)` 実行
- CASCADE DELETE により profiles / projects / project_files 等は DB 側で自動削除
- Supabase Storage の project_zips は手動削除が必要（存在すれば）

**注意点:**
- Storage の cleanup は CASCADE しないため、削除 API 内で明示的に実行が必要
- 削除は不可逆。確認フロー（メールアドレス入力）を必ず入れる
- rate limit 対象にする

---

## 実装順序（推奨）

1. **月次クレジット付与** → 有料ユーザーへの影響が最大。Stripe 実装前でも先行対応が必要。
2. **解約導線（暫定）** → settings ページの UI 追加のみ。Stripe なしで対応できる。
3. **アカウント削除** → 個人情報削除リクエストへの自動対応。
4. **30日削除 cron** → データ整合性の問題。ユーザー数が増えてから本番稼働でも可。

## 依存関係

- タスク1の Inngest cron は `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` が本番設定済みであることが前提
- タスク3は `last_accessed_at` migration を先に適用してからアプリコードを変更する順序が安全
- タスク4は Supabase Auth の `admin.deleteUser` が service role key 経由で呼べることを確認

## 環境変数

Phase B で新たに必要になる環境変数（Stripe 実装時のみ）:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

いずれも追加前に承認が必要。

## 完了条件

- [ ] 有料ユーザーが翌月1日に自動でクレジットを受け取れる
- [ ] settings ページに解約への導線（暫定：サポートリンク）がある
- [ ] 30日未アクセスのプロジェクトの content が自動削除される
- [ ] settings ページからアカウント削除ができる
- [ ] `npm run build` が通る
- [ ] Inngest dev server でのローカル動作確認済み
