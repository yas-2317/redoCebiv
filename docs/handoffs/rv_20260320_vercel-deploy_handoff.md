# Vercel デプロイ設定 ハンドオフ

## 概要

redoCebiv を Vercel にデプロイし、GitHub リポジトリと連携する設定を完了した。

## 実施内容

### GitHub リポジトリ
- URL: https://github.com/yas-2317/redoCebiv（private）
- main ブランチを push 済み
- `.env.local` は `.gitignore` で除外済み（安全）

### Vercel デプロイ
- URL: https://redocebiv.vercel.app
- GitHub 連携済み（push → 自動デプロイ）
- デプロイ成功確認済み

### Vercel 環境変数（設定済み）

| キー | 備考 |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公開キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー |
| `ANTHROPIC_API_KEY` | Anthropic API キー |
| `INNGEST_EVENT_KEY` | 本番用キー（.env.local のコメントアウト行） |
| `INNGEST_SIGNING_KEY` | 本番用キー（同上） |
| `NEXT_PUBLIC_APP_URL` | 現在 localhost のまま（要対応） |

## 残タスク（公開前に対応）

### 1. 認証リダイレクト修正
ログイン後に `localhost:3000` にリダイレクトされる問題。公開前に以下を対応：

- Vercel 環境変数: `NEXT_PUBLIC_APP_URL` を `https://app.quiet-tools.jp` に変更
- Supabase ダッシュボード → Authentication → URL Configuration:
  - Site URL: `https://app.quiet-tools.jp`
  - Redirect URLs: `https://app.quiet-tools.jp/**` を追加

### 2. カスタムドメイン紐付け
- Cloudflare で `app.quiet-tools.jp` の CNAME レコードを追加
  - タイプ: CNAME / 名前: app / ターゲット: `cname.vercel-dns.com`
  - プロキシ: **オフ（グレークラウド）**← 重要
- Vercel プロジェクト設定 → Domains → `app.quiet-tools.jp` を追加

## 現状

- 本番デプロイ済みだが**未公開**（URLを知らないと見られない）
- ドメイン紐付けを行うタイミングで公開となる
