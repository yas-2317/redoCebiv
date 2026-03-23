# セキュリティ修正計画 ハンドオフ

**作成日**: 2026-03-22
**更新日**: 2026-03-23
**ブランチ**: feature/copy-update（作業ツリー上で実装）
**ステータス**: Phase 1 / Phase 2 実装完了

---

## 背景

アプリ全体のセキュリティ監査を実施し、14件の脆弱性・攻撃リスクを特定した。
本ハンドオフは修正計画をフェーズ別に記録したもの。

---

## 2026-03-23 実装結果

実装完了:
- Issue 1: `src/app/api/projects/route.ts` の事前残高確認を廃止し、`consume_credits` をプロジェクト作成直後に実行する形へ変更
- Issue 2: `supabase/migrations/013_credit_integrity.sql` を追加し、`check_rate_limit` を sliding window 方式へ差し替え
- Issue 3: `src/lib/traces/service.ts` で `related_file_paths` をサニタイズし、全件 unsafe の場合は `FILES_NOT_FOUND` で打ち切るよう変更
- Issue 6: OAuth callback の `next` を相対パスのみに制限
- Issue 8: `src/app/api/projects/route.ts` の DB / Storage エラー詳細をレスポンスから削除
- Issue 9: `src/lib/security/validation.ts` で `selectedFiles` の `..` / 絶対パスを拒否
- Issue 10: challenge submit API に user 単位 rate limit を追加

補足:
- Issue 1 については、既存の `consume_credits` RPC 自体は `FOR UPDATE` を使ったアトミック実装だった。実際の競合ポイントは「残高確認 → ZIP upload → 後から消費」という API 側フローだったため、今回は新しい credit consume RPC は増やさず、消費タイミングの前倒しで解消した
- Issue 5 は外部システム（Storage / Inngest）を含むため厳密な DB transaction にはできないが、クレジット消費を先行させた上で upload / queue 失敗時に補償返金する形へ整理した

2026-03-24 追補:
- Issue 5 の残課題だった「返金失敗の無音サイレント」を修正。`src/app/api/projects/route.ts` に `refundCreditsWithAudit()` を追加し、`refund_credits` RPC の失敗を検知して `console.error` に `userId` / `projectId` / `reason` を残すよう変更
- upload 失敗時は、返金成功なら従来どおり project を削除し、返金失敗なら `status=error` と `error_message` を残して手動対応が必要な状態を可視化
- Inngest enqueue 失敗時は、返金成功 / 失敗に応じて `error_message` を分岐し、手動返金が必要なケースを project レコード上で判別できるようにした

検証:
- `npm run lint` 通過
- `npm run build` 通過

未対応:
- Issue 4: 変更提案へのプロンプトインジェクション
- Issue 7: Service Role Key の過剰利用・分散
- Issue 12: CSP の `unsafe-inline` / `unsafe-eval`
- Issue 13: ZIP の秘密情報が DB に保存される
- Issue 14: 管理 API にページネーションなし

---

## 発見した問題一覧

| # | 重要度 | 内容 | 対象ファイル |
|---|---|---|---|
| 1 | CRITICAL | クレジット消費レースコンディション | `src/app/api/projects/route.ts` |
| 2 | CRITICAL | レートリミット 固定ウィンドウ境界バイパス | `supabase/migrations/011_rate_limits.sql` |
| 3 | CRITICAL | `relatedPaths` パストラバーサル未検証 | `src/lib/traces/service.ts` |
| 4 | HIGH | 変更提案へのプロンプトインジェクション | `src/lib/anthropic/proposal.ts` |
| 5 | HIGH | Inngest失敗時の返金が非トランザクション | `src/app/api/projects/route.ts` |
| 6 | HIGH | OAuthコールバック オープンリダイレクト | `src/app/api/auth/callback/route.ts` |
| 7 | HIGH | Service Role Key の過剰利用・分散 | 複数ファイル |
| 8 | HIGH | エラーレスポンスにDB内部情報が漏洩 | `src/app/api/projects/route.ts` |
| 9 | HIGH | `selectedFiles` パストラバーサル未検証 | `src/lib/security/validation.ts` |
| 10 | MEDIUM | チャレンジ提出エンドポイントにレート制限なし | `src/app/api/.../submit/route.ts` |
| 11 | MEDIUM | トレース重複生成レースコンディション | `src/lib/traces/service.ts` |
| 12 | MEDIUM | CSP に `unsafe-inline` / `unsafe-eval` | `next.config.ts` 等 |
| 13 | MEDIUM | ZIPの秘密情報がDBに保存される | `src/lib/zip/index.ts` |
| 14 | MEDIUM | 管理APIにページネーションなし | `src/app/api/admin/backfill-*.ts` |

**Issue 11 補足**: コードを精読した結果、現行ロジックは正しく動作していることを確認。対応不要。

---

## 修正計画

### Phase 1：軽量コード修正（移行なし）

**対象**: Issue 3, 6, 8, 9, 10
**方針**: 1件ずつ独立して修正できる小規模な修正。DB移行なし。

---

#### Issue 6 — OAuthコールバック オープンリダイレクト

**ファイル**: `src/app/api/auth/callback/route.ts` L8, L31

```diff
- const next = searchParams.get('next') ?? '/'
- return NextResponse.redirect(`${origin}${next}`)
+ const rawNext = searchParams.get('next') ?? '/'
+ // 相対パスのみ許可。// で始まるものはプロトコル相対URLになるため拒否
+ const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/'
+ return NextResponse.redirect(`${origin}${next}`)
```

---

#### Issue 8 — エラーレスポンスのDB情報漏洩

**ファイル**: `src/app/api/projects/route.ts` L77, L94

```diff
- return NextResponse.json({ error: 'DB_ERROR', detail: projectError?.message }, { status: 500 })
+ return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
```

```diff
- return NextResponse.json({ error: 'UPLOAD_FAILED', detail: uploadError.message }, { status: 500 })
+ return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 })
```

---

#### Issue 9 — selectedFiles パストラバーサル

**ファイル**: `src/lib/security/validation.ts` L72-76

```diff
  const trimmed = entry.trim()
  if (!trimmed || trimmed.length > MAX_PATH_LENGTH) {
    return { ok: false, error: 'INVALID_SELECTED_FILES' }
  }
+ if (trimmed.includes('..') || trimmed.startsWith('/')) {
+   return { ok: false, error: 'INVALID_SELECTED_FILES' }
+ }
  selectedFiles.push(trimmed)
```

---

#### Issue 3 — relatedPaths パストラバーサル

**ファイル**: `src/lib/traces/service.ts` L105-112
**補足**: RLSで `project_id` フィルターが効いているため実害は限定的だが、防御的に追加する。

```diff
  const relatedPaths: string[] = usecase.related_file_paths ?? []
+ const safePaths = relatedPaths.filter(
+   p => typeof p === 'string' && !p.includes('..') && !p.startsWith('/')
+ )

  if (relatedPaths.length > 0) {
-   filesQuery = filesQuery.in('path', relatedPaths)
+   filesQuery = filesQuery.in('path', safePaths)
  } else {
```

---

#### Issue 10 — チャレンジ提出エンドポイントにレート制限なし

**ファイル①**: `src/lib/security/rate-limit.ts`

```diff
  changeProposal: {
    scope: 'change_proposal',
    limit: 15,
    windowSeconds: 10 * 60,
  },
+ challengeSubmit: {
+   scope: 'challenge_submit',
+   limit: 60,         // 10分で60回（1秒1回程度）
+   windowSeconds: 10 * 60,
+ },
```

**ファイル②**: `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts`
認証チェックの直後に追加：

```diff
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

+ const allowed = await enforceRateLimit({
+   supabase,
+   actorKey: user.id,
+   ...RATE_LIMITS.challengeSubmit,
+ })
+ if (!allowed) return rateLimitExceededResponse()
```

---

### Phase 2：クレジット整合性（SQLマイグレーション + コード修正）

**対象**: Issue 1, 2, 5
**方針**: 新規マイグレーション `013_credit_integrity.sql` を作成する。

---

#### Issue 1 — クレジット消費レースコンディション（CRITICAL）

**問題**: 「残高確認 → アップロード → 消費」が非アトミック。並行リクエストが同時に残高チェックを通過できる。

**マイグレーション追加**:

```sql
-- 013_credit_integrity.sql
CREATE OR REPLACE FUNCTION consume_credits_atomic(
  p_user_id UUID,
  p_amount   INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE profiles
  SET credit_balance = credit_balance - p_amount
  WHERE id = p_user_id
    AND credit_balance >= p_amount;

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION consume_credits_atomic(UUID, INTEGER) TO authenticated;
```

**コード修正**: `src/lib/credits/index.ts` の `consumeCredits` を上記RPC呼び出しに変更。既存の事前チェック（`profile.credit_balance < CREDIT_COSTS.initial_analysis`）は廃止してよい（RPC内でアトミックに検証するため）。

---

#### Issue 2 — レートリミット 固定ウィンドウ境界バイパス

**問題**: 固定ウィンドウ方式。ウィンドウ境界直前 + 直後で制限の2倍のリクエストを送れる。

**修正方針**: スライディングウィンドウへ変更。個別リクエスト時刻を記録し「今から N 秒前以降のカウント」でチェックする。

**マイグレーション追加**:

```sql
-- 013_credit_integrity.sql（続き）

-- スライディングウィンドウ用テーブル
CREATE TABLE IF NOT EXISTS rate_limit_requests (
  id         BIGSERIAL PRIMARY KEY,
  scope      TEXT NOT NULL,
  actor_key  TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_requests_lookup
  ON rate_limit_requests(scope, actor_key, requested_at DESC);

ALTER TABLE rate_limit_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON rate_limit_requests FROM anon, authenticated;

-- check_rate_limit をスライディングウィンドウに差し替え
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_scope          TEXT,
  p_actor_key      TEXT,
  p_limit          INTEGER,
  p_window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_count       INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  IF p_scope IS NULL OR p_scope = '' THEN
    RAISE EXCEPTION 'scope is required';
  END IF;
  IF p_actor_key IS NULL OR p_actor_key = '' THEN
    RAISE EXCEPTION 'actor_key is required';
  END IF;
  IF p_limit <= 0 THEN
    RAISE EXCEPTION 'limit must be positive';
  END IF;
  IF p_window_seconds <= 0 THEN
    RAISE EXCEPTION 'window_seconds must be positive';
  END IF;

  v_window_start := NOW() - (p_window_seconds || ' seconds')::INTERVAL;

  -- 古いレコードを削除（7日より古い）
  DELETE FROM rate_limit_requests
  WHERE scope = p_scope
    AND actor_key = p_actor_key
    AND requested_at < NOW() - INTERVAL '7 days';

  -- ウィンドウ内のカウント確認
  SELECT COUNT(*) INTO v_count
  FROM rate_limit_requests
  WHERE scope = p_scope
    AND actor_key = p_actor_key
    AND requested_at > v_window_start;

  IF v_count >= p_limit THEN
    RETURN FALSE;
  END IF;

  -- リクエストを記録
  INSERT INTO rate_limit_requests (scope, actor_key, requested_at)
  VALUES (p_scope, p_actor_key, NOW());

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION check_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
```

**注意**: 既存の `rate_limits` テーブルは互換性のためそのまま残す。新しい `rate_limit_requests` テーブルを使う形に切り替える。

---

#### Issue 5 — Inngest失敗時の返金が非トランザクション

**問題**: Inngest送信失敗 → 返金RPC失敗 → クレジット永久消失のケースが無音で起きる可能性。

**修正方針**: 今フェーズはロギング強化 + `refund_failed` ステータスで追跡可能にする。完全なトランザクション保証は将来のInfra対応に委ねる。

**ファイル**: `src/app/api/projects/route.ts` L113-124

```diff
  } catch (err) {
    console.error('Inngest send error:', err)
-   await serviceClient.rpc('refund_credits', {
-     p_user_id: user.id,
-     p_amount: CREDIT_COSTS.initial_analysis,
-     p_project_id: project.id,
-   })
-   await supabase.from('projects').update({ status: 'error' }).eq('id', project.id)
+   const { error: refundError } = await serviceClient.rpc('refund_credits', {
+     p_user_id: user.id,
+     p_amount: CREDIT_COSTS.initial_analysis,
+     p_project_id: project.id,
+   })
+   if (refundError) {
+     console.error('CRITICAL: refund failed after Inngest error', {
+       userId: user.id,
+       projectId: project.id,
+       amount: CREDIT_COSTS.initial_analysis,
+       refundError,
+     })
+     await supabase.from('projects').update({ status: 'refund_failed' }).eq('id', project.id)
+   } else {
+     await supabase.from('projects').update({ status: 'error' }).eq('id', project.id)
+   }
    return NextResponse.json({ error: 'QUEUE_FAILED' }, { status: 500 })
  }
```

**将来タスク**: `refund_failed` ステータスの件数を監視する管理画面を追加する。

---

### Phase 3：構造的改善（別イシューで順次対応）

**対象**: Issue 4, 7, 12, 13, 14
**方針**: リスクはあるが即時被害が限定的か対応コストが大きいため、独立イシューとして起票して計画的に対応する。

| Issue | 内容 | 方針 |
|---|---|---|
| 4 | プロンプトインジェクション | システムプロンプトに `<user_intent>` タグで区切り、「ユーザー入力として扱え」と明示する |
| 7 | Service Role Key 分散 | `src/lib/supabase/service.ts` に集約 + `import 'server-only'` を追加 |
| 12 | CSP `unsafe-inline` | Next.js の nonce ベース CSP に移行（middleware.ts 改修が必要） |
| 13 | ZIP秘密情報がDBに保存 | 秘密情報検出ファイルは content を `[REDACTED]` に置き換えてDB保存 |
| 14 | 管理API ページネーションなし | `?limit=100&offset=0` を受け付けるように変更 |

---

## 実装時の注意

- Phase 2 のマイグレーションは `supabase db push` 前に必ずローカルで動作確認する
- `consume_credits_atomic` 導入後は既存の `consumeCredits` の事前チェックロジックと二重にならないよう注意
- スライディングウィンドウへの切り替え後、既存の `rate_limits` テーブルへの書き込みが止まることを確認してから旧テーブルを削除する（すぐ削除しない）
- `refund_failed` ステータスを追加する場合、フロントエンド側でそのステータスの表示を想定しておく

---

## 次のアクション

1. このハンドオフを確認・承認
2. Linear に Phase 1・Phase 2 それぞれのイシューを起票
3. `git checkout -b feature/security-fixes` でブランチを切って Phase 1 から実装開始
