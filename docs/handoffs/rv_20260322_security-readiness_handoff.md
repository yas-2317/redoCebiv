# セキュリティ公開準備 ハンドオフ

## 概要

redoCebiv をウェブ公開する前提で、現行実装から見えるセキュリティリスクを整理した。
このアプリは一般的な SaaS と違って、ユーザーのソースコード ZIP を受け取り、解析し、一部を外部 AI に送るため、`認可` `アップロード防御` `機密情報保護` `濫用対策` の優先度が高い。

今回の整理では、`コード上で修正できること` と `コード外で対応すべきこと` を分けている。

## 結論

公開前の Phase 1 で最優先に着手したいのは次の 3 点。

1. `/api/admin/*` を管理者専用にする
2. ZIP 防御を強化する
3. `next.config.ts` にセキュリティヘッダーを入れる

補足:
- CSRF の `Origin` チェックは重要だが、Supabase Auth App Router 構成の `SameSite=Lax` な httpOnly Cookie により一般的な CSRF リスクはかなり抑えられるため、Phase 2 へ後ろ倒しでよい
- rate limit は新規インフラ依存を増やさず、Supabase の DB テーブルで実装候補とする

## 実装状況

2026-03-22 時点で Phase 1 は実装済み。

実装済み:
1. `/api/admin/*` の共通 `requireAdmin()` ガード追加
2. ZIP の magic bytes 検証追加
3. ZIP 展開時のサイズ / 件数 / パス安全性チェック追加
4. `next.config.ts` のセキュリティヘッダー追加

検証:
- `npm run lint` 通過
- `npm run build` 通過

注意:
- `requireAdmin()` は Supabase Auth の `user.app_metadata.role === 'admin'` または `user.app_metadata.is_admin === true` を前提にしている
- そのため、管理者ユーザーには Supabase Auth 側で app metadata 設定が必要

## コードで修正できるところ

### 1. 管理 API の認可強化

対象:
- `src/app/api/admin/backfill-stacks/route.ts`
- `src/app/api/admin/backfill-relevant-stacks/route.ts`

現状:
- ログイン済みユーザーなら実行できる実装に見える

方針:
- `profiles` などに `role` か `is_admin` を持たせる
- API 共通ガードを作り、`admin` 配下は必ず管理者判定を通す

提案実装:
- `src/lib/auth/require-user.ts` などに `requireUser()` を追加
- `src/lib/auth/require-admin.ts` などに `requireAdmin()` を追加
- 管理 API は全て `requireAdmin()` を使う

### 2. API 入力値のスキーマ検証

対象:
- `src/app/api/projects/[id]/change-proposals/route.ts`
- `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts`
- 今後増える JSON body を受ける API 全般

現状:
- 手動バリデーション中心で、型・文字数・件数制限が弱い

方針:
- `zod` などで request schema を定義する

提案実装:
- `intent` に最大文字数を入れる
- `selectedFiles` の件数上限と各文字列長を制限する
- `answerText` の最大長を制限する
- path param も UUID 形式などで検証する

### 3. ZIP アップロード防御

対象:
- `src/app/api/projects/route.ts`
- `src/lib/zip/index.ts`

現状:
- `.zip` と 20MB 制限はある
- 展開後サイズ、総ファイル数、深いネストへの制限が見えない

方針:
- ZIP bomb や異常アーカイブを弾く

提案実装:
- アップロード直後に magic bytes (`PK\x03\x04`) を確認し、ZIP 偽装ファイルを弾く
- 展開後総サイズの上限を入れる
- 最大ファイル数を入れる
- 1 ファイルあたりのサイズ上限を入れる
- パス長とディレクトリ深さを制限する
- 異常なファイル名や想定外パスを除外する

### 4. AI 送信前の機密情報除外

対象:
- `src/lib/zip/index.ts`
- `src/lib/inngest/functions/analyze-project.ts`
- `src/lib/proposals/service.ts`
- `src/lib/traces/service.ts`

現状:
- 生成物やバイナリの除外はある
- `.env` や鍵ファイル除外が十分ではない

方針:
- AI に送るファイル選定前に、秘密情報らしいファイルを除外する

提案実装:
- `.env`, `.env.*`, `*.pem`, `*.key`, `id_rsa`, `credentials.json` などを除外対象に追加
- API key らしい内容を簡易検知したら、そのファイルも AI 送信対象から外す
- スキップ件数だけログに残し、内容はログに出さない

### 5. CSRF 対策

対象:
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/route.ts`
- `src/app/api/projects/[id]/change-proposals/route.ts`
- `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts`

現状:
- Cookie ベース認証だが、明示的な CSRF 対策が見えない

方針:
- Supabase Auth App Router 構成では `SameSite=Lax` の httpOnly Cookie が前提になるため、一般的な CSRF の優先度は相対的に下げてよい
- `Origin` チェックは Phase 2 で導入する

提案実装:
- `assertSameOrigin(request)` のような共通関数を作る
- `POST` `PUT` `PATCH` `DELETE` の API 冒頭で検証する
- `NEXT_PUBLIC_APP_URL` と照合して不一致なら拒否する

### 6. レート制限

対象:
- ログイン
- サインアップ
- ZIP アップロード
- トレース生成
- 変更候補生成

現状:
- アプリ側の rate limit は未実装に見える

方針:
- 認証系は IP ベース
- AI/課金系は user ベース

提案実装:
- 新規依存を増やさず、Supabase の `rate_limits` テーブルで実装する
- 認証系は IP キー、AI/課金系は user ID キーでカウントする
- `429` 応答を統一する

### 7. セキュリティヘッダー

対象:
- `next.config.ts`

現状:
- 未設定

方針:
- アプリ全体に最低限のヘッダーを付与する

提案実装:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy`
- `Permissions-Policy`
- `frame-ancestors` もしくは `X-Frame-Options`

### 8. ログとエラーハンドリング

対象:
- API 全般

現状:
- `console.error` はあるが、監査ログとしては弱い

方針:
- 秘密情報を出さずに、route / userId / projectId / error code を追えるようにする

提案実装:
- request body やファイル内容はログに出さない
- AI 失敗、アップロード失敗、管理 API 実行は識別しやすいログにする

## コード以外で対応するところ

### 1. Supabase の RLS / Storage policy 監査

確認対象:
- `projects`
- `project_files`
- `usecases`
- `traces`
- `challenge_submissions`
- `change_proposals`
- `project_zips`

確認事項:
- 本人以外が読めないか
- 本人以外が削除できないか
- service role 前提の操作が一般クライアントに開いていないか

### 2. 本番環境変数の管理

対象:
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`
- `INNGEST_EVENT_KEY`
- `INNGEST_SIGNING_KEY`

対応:
- Vercel でのみ管理
- ローカル値と本番値を分離
- ログやエラーメッセージに出さない

### 3. Inngest 本番署名の確認

対応:
- 本番で `INNGEST_SIGNING_KEY` が未設定のまま公開しない
- デプロイ時に必須チェックがあるとよい

### 4. 利用規約 / プライバシーポリシー

このアプリ特有の重要事項:
- アップロードされたコードを解析すること
- コードの一部が外部 AI 提供者へ送られる可能性があること
- 保存期間と削除ポリシー

### 5. 監視とインシデント対応

対応:
- 5xx 急増
- AI API 失敗率上昇
- ログイン失敗急増
- アップロード失敗急増

を検知できる監視導入を検討する

## 推奨の着手順

### Phase 1: 公開前に必須

1. 管理 API の `requireAdmin()` 化
2. ZIP 展開防御
3. `next.config.ts` のセキュリティヘッダー追加

Phase 1 の ZIP 展開防御に含めるもの:
- magic bytes (`PK\x03\x04`) 確認
- 展開後総サイズ上限
- 最大ファイル数
- 1 ファイル上限
- パス長 / 深さ制限

Phase 1 の状態:
- 実装済み
- 次にやることは Phase 2 の機密除外 / スキーマ検証 / rate limit

### Phase 2: 早めに実施

1. `zod` による API スキーマ検証
2. AI 送信前の機密除外
3. `Origin` チェックによる CSRF 多重防御
4. rate limit 導入
5. エラーログ整備

### Phase 3: 公開判定前に確認

1. Supabase RLS / Storage policy 監査
2. Inngest 本番署名確認
3. 規約・プライバシーポリシー整備
4. `npm audit` で依存脆弱性確認

## 次の実装候補

次に着手するなら、以下の順が安全。

1. AI 送信対象の機密除外
2. `zod` による API スキーマ化
3. Supabase ベースの rate limit
4. `assertSameOrigin()` の追加

## 備考

- Phase 1 実装後の状態に更新済み
- 実装に入るタイミングで、対応内容ごとに別ハンドオフを切ると追いやすい
- フィードバックを反映し、CSRF は Phase 2 に後ろ倒し、rate limit は Supabase 実装前提、ZIP 防御には magic bytes を追加、公開判定前チェックに `npm audit` を追加した
