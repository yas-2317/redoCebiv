# Handoff: レビュー指摘への対応方針

**日付**: 2026-03-20
**ブランチ**: feature/copy-update（現時点）
**元レビュー**: `rv_20260320_review_handoff.md`
**担当**: Claude Code（Sonnet 4.6）

---

## 概要

`rv_20260320_review_handoff.md` の14指摘に対し、
優先度・対応方針・保留事項を整理したもの。
コード変更はまだ行っていない。

---

## 対応方針サマリー

| # | 指摘 | 方針 | 優先度 |
|---|---|---|---|
| 1 | challenges.format 保存漏れ | 即修正（1行） | 最高 |
| 2 | difficulty 4-5 表示未対応 | 共通定数化と同時に修正 | 高 |
| 3 | billing cost のズレ | **値の確認後**に統一（後述） | 高 |
| 4 | proposal 先行課金 | 即修正 | 高 |
| 5 | trace 二重実装 | 中長期・後回し | 低 |
| 6 | trace insert error の粗い分岐 | 中長期・後回し | 低 |
| 7 | progress 指標の重複カウント | **仕様確認後**に実装（後述） | 中 |
| 8 | explanation cache key が粗い | 後回し | 低 |
| 9 | page に責務集中 | 後回し（機能追加時に自然に対処） | 低 |
| 10 | StackBadge bundle 問題 | 体感問題なければ後回し | 低 |
| 11 | `as unknown as` 多用 | Supabase generated types 導入時に対処 | 低 |
| 12 | billing ハードコード | #3 と同時対応 | 高 |
| 13 | difficulty 表示の重複 | #2 と同時対応（共通定数化） | 高 |
| 14 | 対応スタック方針の明文化 | UIに方針を反映（後述） | 中 |
| - | lint 失敗 | 即修正 | 高 |

---

## 着手順

```
Step 1. challenges.format 保存漏れ修正
Step 2. proposal 先行課金修正
Step 3. lint 解消
Step 4. billing cost 統一（値の確認後）
Step 5. difficulty 4-5 表示 + 共通定数化
Step 6. progress 指標の見直し（仕様確認後）
Step 7. 対応スタック方針の明文化（UIに反映）
```

---

## Step 1: challenges.format 保存漏れ（確定バグ）

**ファイル**: `src/lib/inngest/functions/analyze-project.ts`

`analyze.ts` は difficulty 4-5 に対し `format: 'code_choice'` を返しているが、
challenge insert 時に `format` が渡されていない。
DB default（`file_selection`）で保存されるため、code_choice UI が出ない。

**修正内容**:
- insert の challenge オブジェクトに `format: ch.format` を追加
- 既存データ backfill が必要かどうかも確認

---

## Step 2: proposal 先行課金修正（確定バグ）

**ファイル**: `src/app/api/projects/[id]/change-proposals/route.ts`

`consumeCredits()` が project_files 取得より前に実行されている。
ファイル不在・取得失敗時にも credits が減る。
trace 側では同種のバグが修正済みのため、同じパターンで直す。

**修正内容**:
- `consumeCredits()` をファイル取得・バリデーション後に移動
- trace route のコードをリファレンスにする

---

## Step 3: lint 解消

**ファイル**:
- `src/components/project/AnalyzingStatus.tsx`: `<a>` → `<Link>` に変更
- `src/app/(auth)/login/page.tsx`: 未使用 import を削除

---

## Step 4: billing cost 統一

**確定値**:

| 項目 | 正しい値 | 現状の `CREDIT_COSTS` | 実装（API） |
|---|---|---|---|
| analyze | **5** | 10（誤り） | 5（正しい） |
| proposal | **2** | 1（誤り） | 2（正しい） |

`CREDIT_COSTS` の値が間違っているため、config 側を実装に合わせて修正する。

**修正範囲**:
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/change-proposals/route.ts`
- `src/components/project/ProjectUploadForm.tsx`（UI文言）
- `src/components/change/ChangeIntentForm.tsx`（UI文言）
- `src/app/(app)/layout.tsx`（UI文言）

すべて `CREDIT_COSTS` から参照する形に統一する。

---

## Step 5: difficulty 4-5 表示 + 共通定数化

**現状**: `DIFFICULTY_STARS` が `{1, 2, 3}` のみ。difficulty 4-5 は `??` でフォールバック。

**修正内容**:
- `src/lib/challenges/config.ts` を新設し、difficulty ラベルを定義
- 以下の3箇所から参照に統一:
  - `src/app/(app)/projects/[id]/page.tsx`
  - `src/components/challenge/ChallengeView.tsx`
  - `src/components/change/ProposalCard.tsx`

---

## Step 6: progress 指標の見直し

**確定仕様**:

| 指標 | 定義 |
|---|---|
| challenge total | 課題総数（challenges テーブルの件数） |
| attempted | submission が1件以上ある distinct challenge 数 |
| got back | 最新 grade が `self` の distinct challenge 数 |

同じ課題を何度解いても1件としてカウントする。

**修正内容**:
- `totalChallenges` を challenges テーブルの総数に変更
- `gotBack` を `grade='self'` の distinct challenge 数に変更
- submission を複数回行ったユーザーへの影響を確認（数字が下がる場合がある）

---

## Step 7: 対応スタック方針の明文化

**問題**:
- UI は Web / Mobile / Backend 全般に対応するように見える
- 実装（zip解析・AI解析）は Next.js / React / TypeScript 前提が強い
- このズレが「バグではないのにバグに見える」問題を生む

**方針**: B — stack 別 analyzer を追加して対応範囲を本当に広げる。

**実装方針**:
- zip 解析（`src/lib/zip/index.ts`）の言語判定ロジックを汎用化
- AI 解析プロンプトを stack 別に分岐できる構造にする
- ProjectUploadForm に対応スタックの明示を追加し、未対応 stack のアップロード時に警告を出す
- 優先拡張スタックは別途決定（Next.js 以外で需要の高いものから）

---

## 後回しにしてよい理由

**trace 二重実装・page 分割・StackBadge bundle**は、
現在の規模では過剰設計になる可能性が高い。
機能追加・バグが起きたタイミングで自然にリファクタする方が効率的。

service 化は「同じバグを2箇所直し続ける痛みが出た時」にやる。

---

## 未解決・確認が必要な項目

1. **format backfill**: 既存 challenges に `format` を埋めるか（DB に `code_choice` が0件なら不要。Step 1 実施後に確認）
2. **優先拡張スタック**: Next.js 以外でどのスタックから対応を広げるか（Step 7 実施前に確認）
