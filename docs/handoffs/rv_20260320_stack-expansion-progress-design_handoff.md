# redoCebiv ハンドオフ — 2026-03-20 stack拡張 / 課金信頼性 / 仕様書更新 / 次フェーズ設計

作成日: 2026-03-20
ステータス: In progress
対象: stack-aware 実装、trace/proposal 信頼性修正、現行仕様の記録、progress/billing 次設計

---

## 概要

このセッションでは、redoCebiv の多スタック対応の土台づくりと、
trace / proposal 周辺の課金・失敗補償の correctness 改善を行った。

あわせて、ここまでの実装状態を仕様書として記録し、
次に着手すべき progress 指標設計と billing 単一ソース化の設計まで整理した。

---

## 今回完了したこと

### 1. stack-aware prompt 基盤を導入

新規:
- `src/lib/anthropic/stack-prompts.ts`

内容:
- Flutter / Swift / Ruby on Rails / Python / Vue / Nuxt / Svelte / SvelteKit / default web の prompt 文脈を一元管理
- 以下を `StackPromptContext` として共通化
  - `appDescription`
  - `usecaseGuidance`
  - `challengeGuidance`
  - `traceGuidance`
  - `proposalGuidance`
  - `gradingPatternLabel`
  - stack 別 few-shot examples

接続先:
- `src/lib/anthropic/analyze.ts`
- `src/lib/anthropic/trace.ts`
- `src/lib/anthropic/proposal.ts`
- `src/lib/anthropic/grade.ts`

効果:
- React / Next.js 固定の説明から脱却
- 非 web stack でも prompt 文脈が破綻しにくくなった

---

### 2. stack-aware few-shot を導入

内容:
- 抽象プレースホルダーではなく、stack ごとの具体例を prompt に差し込む構造へ変更
- challenge / trace / proposal の例を stack ごとに保持

ポイント:
- すべて「submit の disabled 条件」を軸に揃えた illustrative 例
- few-shot の更新コストを `stack-prompts.ts` に閉じ込めた

---

### 3. file selection を stack-aware 化

変更:
- `src/lib/zip/index.ts`

内容:
- `selectFilesForAnalysis(files, maxTokens, projectStack = [])` に拡張
- stack ごとに priority1 / priority2 を切り替え
- `.dart`, `.swift`, `.rb`, `.py`, `.vue`, `.svelte` の language 判定を追加

効果:
- Flutter / Swift / Rails / Python / Vue / Svelte 系で、
  web 偏重のファイル選定になる問題を大きく軽減

---

### 4. primary stack 解決を明示化

新規:
- `src/lib/stacks/primary.ts`

内容:
- `getPrimaryStack(projectStack)` を追加
- selector と prompt が同じ primary stack を参照するよう統一

現行優先順位:
1. Flutter
2. Swift
3. Ruby on Rails
4. Python
5. Vue
6. Nuxt
7. Svelte
8. SvelteKit
9. Next.js
10. React
11. なければ `projectStack[0]`

接続:
- `src/lib/zip/index.ts`
- `src/lib/anthropic/stack-prompts.ts`

---

### 5. trace を service 化して route / page を一本化

新規:
- `src/lib/traces/service.ts`

変更:
- `src/app/api/projects/[id]/usecases/[ucId]/trace/route.ts`
- `src/app/(app)/projects/[id]/trace/[ucId]/page.tsx`

service の責務:
1. project 取得
2. usecase 取得
3. cache 確認
4. files 取得
5. 課金
6. AI 生成
7. 保存
8. 返金補償

修正した問題:
- route / page の二重実装
- 先行課金
- 保存失敗時の補償不足
- AI 生成失敗時の返金漏れ
- UNIQUE 制約違反時の重複返金バグ

補足:
- `TRACE_GENERATION_FAILED` / `TRACE_SAVE_FAILED` は page 側で 404 ではなく error boundary に流すよう修正済み

---

### 6. proposal を service 化して先行課金を修正

新規:
- `src/lib/proposals/service.ts`

変更:
- `src/app/api/projects/[id]/change-proposals/route.ts`

service の責務:
1. project 取得
2. files 取得
3. stack-aware file selection
4. 課金
5. AI 生成
6. 保存
7. 返金補償

修正した問題:
- file 不在時の先行課金
- 保存失敗時の未返金
- AI 生成失敗時の未返金

---

### 7. 既存 lint エラーを解消

変更:
- `src/components/project/AnalyzingStatus.tsx`
- `src/app/(auth)/login/page.tsx`

状態:
- `npm run lint` 通過済み

---

### 8. 実装仕様を文書化

新規:
- `docs/design/current-implementation-spec.md`

内容:
- 現在の stack 対応方針
- primary stack 解決
- stack-aware AI 仕様
- file selection 仕様
- trace / proposal の service と補償ルール
- 既知制約
- 次に設計すべき対象

---

### 9. 設計判断ログを更新

変更:
- `docs/design/decisions.md`

追加 ADR:
- ADR-009: 多スタック対応では primary stack を明示解決する
- ADR-010: trace / proposal の AI 実行は service に集約し、失敗時は返金補償する

---

## 現在の到達点

ここまでで、以下はかなり安定した。

- stack 拡張の基本構造
- prompt と file selection の整合
- trace / proposal の billing correctness
- AI 実行失敗時の補償
- ここまでの実装内容の設計記録

---

## 未解決・意図的に残しているもの

### 1. progress 指標の定義整理

まだ page 単位の集計が残っており、
「提出回数」ではなく「課題総数ベース」で統一しきれていない。

次フェーズで固定したい定義:
- `total_challenges`
- `attempted_challenges`
- `self_solved_challenges`
- `hint_solved_challenges`
- `missed_challenges`
- `completion_rate`
- `mastery_rate`

原則:
- submission 件数ではなく distinct challenge 単位
- best grade 優先順位は `self > with_hint > missed`

---

### 2. progress 集計の service / query 分離

対象候補:
- `src/app/(app)/progress/page.tsx`
- `src/app/(app)/page.tsx`
- `src/app/(app)/projects/[id]/page.tsx`

追加候補:
- `src/lib/progress/types.ts`
- `src/lib/progress/queries.ts`
- `src/lib/progress/service.ts`

方向性:
- page 内の集計を service に寄せる
- dashboard / progress / project detail で同じ数字を使う

---

### 3. billing 値の単一ソース化

確定値:
- analyze: 5
- trace: 1
- proposal: 2
- grade: 0

未完了:
- `consumeCredits(..., 5)` などのハードコードを `billing/config.ts` 参照に統一すること
- UI 側の表示値も同じ定義から参照すること

---

### 4. trace page の `PROJECT_NOT_READY` UX

現状:
- page 側では `PROJECT_NOT_READY` は `notFound()` に落ちる

優先度:
- correctness ではなく UX 課題なので後回しでよい

候補:
- 「まだ解析中です。しばらくしてから試してください」を表示

---

## 次セッションのおすすめ着手順

1. progress 指標定義を固定する
2. `lib/progress/` を作って集計 service 化する
3. dashboard / progress / project detail の数字をその service に寄せる
4. billing 値を `billing/config.ts` へ統一する
5. 必要なら `current-implementation-spec.md` を更新する

---

## 参考ファイル

主要な参照先:

- `src/lib/anthropic/stack-prompts.ts`
- `src/lib/stacks/primary.ts`
- `src/lib/zip/index.ts`
- `src/lib/traces/service.ts`
- `src/lib/proposals/service.ts`
- `docs/design/current-implementation-spec.md`
- `docs/design/decisions.md`

---

## 検証

実施済み:
- `npm run lint`

結果:
- 通過
