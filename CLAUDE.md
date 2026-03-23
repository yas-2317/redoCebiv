# redoCebiv — CLAUDE.md

## 参照ファイル
- 設計書: projects/redoCebiv/design/overview.md
- 設計判断: projects/redoCebiv/design/decisions.md

## プロダクト概要

AI生成コードの「逆向き理解」支援ツール。
vibe coding で作れたアプリを、機能起点で理解し、軽い変更を自力でできる状態へ導く。

## 技術スタック

| 項目 | 選定 |
|---|---|
| フレームワーク | Next.js（App Router） |
| 言語 | TypeScript |
| UI | React / Tailwind CSS |
| UIコンポーネント | shadcn/ui |
| 対応スタック（拡張中） | Next.js / React / TypeScript / Tailwind |
| DB / Auth / Storage | Supabase |
| AI | Anthropic Claude（Sonnet + Haiku） |
| バックグラウンドジョブ | Inngest |
| デプロイ | Vercel（予定） |

## アーキテクチャルール

| ルール | 理由 |
|---|---|
| App Router を使う（Pages Router 禁止） | Next.js 推奨・最新 |
| Server Component を基本とし、必要な部分のみ Client Component化 | パフォーマンス最適化 |
| `any` 型の使用禁止 | TypeScript の恩恵を最大化 |
| コンポーネントは `components/` 配下に機能単位で整理 | 可読性・保守性 |
| DB アクセスは `lib/` 配下の Service 層に集約（ページ直書き禁止） | 変更容易性・テスト容易性 |
| Claude API 呼び出しは `lib/anthropic/` に集約 | プロンプト管理の一元化 |
| クレジット消費を伴う処理は失敗時に返金する（ADR-010） | ユーザー信頼・整合性 |
| プライマリスタック判定は `lib/stacks/primary.ts` を使う | スタック拡張時の一貫性 |

## 承認が必要な作業

- 新しいパッケージ（npm）の追加
- DB スキーマの破壊的変更
- 認証・決済ロジックの変更
- 環境変数の追加・変更

## ハンドオフ

- 保存場所: `projects/redoCebiv/handoffs/`
- 命名規則: `rv_[YYYYMMDD]_[内容]_handoff.md`（例: `rv_20260320_trace-feature_handoff.md`）
- Linear イシューに対応する場合は `rv_RV-[番号]_handoff.md` でも可

## 料金プラン

| プラン | 月額 | クレジット/月 |
|---|---|---|
| Wanderer（Free） | 無料 | 3 cr |
| Tracer | $5 | 80 cr |
| Navigator | $12 | 250 cr |

**クレジット消費コスト:**

| アクション | 消費 |
|---|---|
| 初期解析（ZIP アップロード） | 5 cr |
| トレース生成 | 1 cr |
| トレース表示（キャッシュ） | 0 cr |
| 変更候補生成 | 2 cr |
| 課題採点 | 0 cr |

## Linear

- 略称: `rv`
- イシュープレフィックス: `RV-`
