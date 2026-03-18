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
| 初期対応スタック | Next.js / React / TypeScript / Tailwind |
| DB / バックエンド | 未定（Supabase は将来候補） |
| デプロイ | 未定（Vercel 想定） |

## アーキテクチャルール

| ルール | 理由 |
|---|---|
| App Router を使う（Pages Router 禁止） | Next.js 推奨・最新 |
| Server Component を基本とし、必要な部分のみ Client Component化 | パフォーマンス最適化 |
| `any` 型の使用禁止 | TypeScript の恩恵を最大化 |
| コンポーネントは `components/` 配下に機能単位で整理 | 可読性・保守性 |

## 承認が必要な作業

- 新しいパッケージ（npm）の追加
- DB スキーマの破壊的変更
- 認証・決済ロジックの変更
- 環境変数の追加・変更

## ハンドオフ

- 保存場所: `projects/redoCebiv/handoffs/`
- 命名規則: `rv_RV-[番号]_handoff.md`（例: `rv_RV-1_handoff.md`）

## Linear

- 略称: `rv`
- イシュープレフィックス: `RV-`
