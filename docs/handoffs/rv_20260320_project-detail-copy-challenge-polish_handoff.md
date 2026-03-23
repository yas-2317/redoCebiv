# redoCebiv ハンドオフ — 2026-03-20 Project Detail / Billing Copy / Challenge Polish

作成日: 2026-03-20
ステータス: Design handoff
対象: project detail 小整理、billing 文言統一、challenge 追加レビュー

---

## 概要

この handoff は、直近の progress / projects / challenge 修正の次にやる小さめの 3 タスクを整理したもの。

対象は以下。

1. `projects/[id]/page.tsx` の数字 source 整理
2. billing UI 文言の `credits` 統一
3. challenge 体験の追加レビューと仕上げ

大きなアーキテクチャ変更ではなく、整合性と読みやすさの仕上げフェーズとして扱う。

---

## 1. Project Detail 小整理

### 目的

`projects/[id]/page.tsx` の進捗値の source を明確にし、`projectProgress` と Supabase 生値の二重 fallback を減らす。

### 背景

現状の detail page は、表示用の `usecases` / `challenges` は page 側で取得しつつ、進捗値は `getProjectProgress()` を参照している。

ただし一部で以下のような fallback が残っている。

- `projectProgress?.usecaseCount ?? usecases?.length ?? 0`
- `projectProgress?.traceCount ?? tracedIds.size`
- `projectProgress?.challengeCount ?? challenges?.length ?? 0`

通常フローでは問題になりにくいが、画面の責務がやや曖昧。

### 対象ファイル

- `src/app/(app)/projects/[id]/page.tsx`
- 必要なら `src/lib/progress/service.ts`

### 設計方針

#### 方針 A

detail page は `ready` project 前提の画面として扱う。

- `project.status !== 'ready'` は analyzing 側へ寄せる、または専用ハンドリング
- `projectProgress` が `null` のケースを通常系として扱わない

#### 方針 B

進捗値は `projectProgress` のみを source にする。

- `usecases` / `challenges` は UI 描画用の取得として残す
- `usecaseCount / traceCount / challengeCount / solvedCount` は service 固定に寄せる

### Done 条件

- progress card の数値が `projectProgress` のみを source にする
- page 内の二重 fallback が最小限になる
- `ready` でない project の扱いが明示される

---

## 2. Billing 文言の統一

### 目的

UI 上の `charts / credits` の揺れをなくし、課金まわりの用語を `credits` に統一する。

### 背景

現在は billing 設計上 `credits` が正式な用語だが、UI にはまだ `charts` が残っている。

例:

- `src/components/change/ChangeIntentForm.tsx` の `-${CREDIT_COSTS.change_proposal} charts`

### 対象ファイル候補

- `src/components/change/ChangeIntentForm.tsx`
- `src/components/project/ProjectUploadForm.tsx`
- `src/app/(app)/settings/page.tsx`
- `src/app/(auth)/signup/page.tsx`

### 設計方針

#### 1. 表示用語を `credits` に統一する

- button 周辺
- billing 説明文
- 残高表示
- plan 説明文

#### 2. 数値は `CREDIT_COSTS` 参照に寄せる

- `-N credits`
- `Free`
- `0 credits`

をハードコードせず config ベースにする。

#### 3. 必要なら語彙を整理する

候補:

- `Spend 2 credits`
- `Uses 2 credits`
- `Free`

### Done 条件

- billing に関する UI 文言が `credits` 基準で揃う
- `charts` 表記が billing 文脈から消える
- 数値表示が config 参照になっている

---

## 3. Challenge 追加レビュー / 仕上げ

### 目的

challenge の保存・表示・提出・説明生成の end-to-end を追加で点検し、残っている小さな仕様ズレを閉じる。

### 背景

ここまでで以下は対応済み。

- `ChallengeAnswer` の共通型化
- `projects/[id]/page.tsx` の difficulty 1-5 表示
- `code_choice` の explanation 入力の format-aware 化

ただし、実際の challenge 体験としてはもう一段レビューしたい。

### レビュー観点

#### 1. `format` の保存と読み出し

- `analyze.ts` で生成した `format`
- `analyze-project.ts` での保存
- `ChallengeView.tsx` での描画分岐

が end-to-end でつながっているか確認する。

#### 2. `code_choice` の result UX

- 正答時
- 誤答時
- hint 使用時

で explanation 文面が自然か確認する。

#### 3. retry / previousSubmission の一貫性

- 過去提出あり
- 再挑戦
- ヒント利用後の再挑戦

で UI の誘導が不自然でないかを見る。

### 対象ファイル

- `src/lib/anthropic/analyze.ts`
- `src/lib/inngest/functions/analyze-project.ts`
- `src/components/challenge/ChallengeView.tsx`
- `src/components/challenge/GradeResult.tsx`
- `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts`

### Done 条件

- challenge の保存・表示・提出・説明生成に未解決のズレがない
- 追加修正が必要なら、次の handoff に切り出せる状態になっている

---

## 推奨実装順

1. Project detail 小整理
2. Billing 文言統一
3. Challenge 追加レビュー

理由:

- まず page の source を揃えると、その後の画面レビューがしやすい
- billing 文言は小さな差分で片付く
- challenge は最後にまとめてレビューするのが効率的

---

## 検証観点

### Project detail

- `ready` project で数字が崩れない
- progress card と feature/challenge 一覧の見え方が矛盾しない

### Billing copy

- proposal / upload / settings / signup で `credits` 表記が揃っている

### Challenge review

- `file_selection`
- `code_choice`

の両方で提出から result 表示まで破綻がない

共通:

- `npm run lint`
- `npx tsc --noEmit`
