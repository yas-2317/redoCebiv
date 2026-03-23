# redoCebiv ハンドオフ — 2026-03-20 Progress/Billing Phase 部分実装

作成日: 2026-03-20
ステータス: In progress
対象: progress service 導入、billing 定数整理、画面接続、仕様書反映

---

## 今回実装したこと

### 1. progress service を追加

新規:
- `src/lib/progress/types.ts`
- `src/lib/progress/queries.ts`
- `src/lib/progress/service.ts`

内容:
- `ProgressSummary` / `ProjectProgressRow` / `StackProgressRow` を定義
- best grade は `self > with_hint > missed`
- progress は distinct challenge 単位で集計
- stack 別 progress は `getPrimaryStack(project.stack)` のみへ帰属

提供関数:
- `getUserProgress(userId)`
- `getUserProgressSummary(userId)`
- `getProjectProgress(userId, projectId)`

補足:
- `getUserProgressSummary()` は初回は薄いラッパー実装

---

### 2. dashboard / progress / project detail を新 service に接続

変更:
- `src/app/(app)/page.tsx`
- `src/app/(app)/progress/page.tsx`
- `src/app/(app)/projects/[id]/page.tsx`

内容:
- 集計の主要部分を page 直書きから service 参照へ移した
- dashboard の全体サマリーを progress service から取得
- progress page の cards / stack / project breakdown を progress service へ接続
- project detail の progress row を `getProjectProgress()` に接続

注意:
- 一部の activity 表示用クエリは page 側に残している
- つまり「集計 service 化」は進んだが、page 内のデータ取得が完全に消えたわけではない

---

### 3. billing 定数を単一ソースへ寄せ始めた

変更:
- `src/lib/billing/config.ts`

内容:
- `BillingAction` を追加
- `CREDIT_COSTS` を action 名ベースへ変更
  - `initial_analysis: 5`
  - `trace_generate: 1`
  - `change_proposal: 2`
  - `challenge_grade: 0`
- `getCreditCost()` を追加

接続済み:
- `src/app/api/projects/route.ts`
- `src/lib/traces/service.ts`
- `src/lib/proposals/service.ts`
- `src/components/change/ChangeIntentForm.tsx`
- `src/components/project/ProjectUploadForm.tsx`

未接続:
- challenge grading 周辺
- credits / settings 周辺で action 名を増やしたい場合の整理

---

### 4. 仕様書と decisions を更新

変更:
- `design/current-implementation-spec.md`
- `design/decisions.md`

追記内容:
- progress 指標仕様
- stack 別 progress を primary stack に帰属させる方針
- challenge 採点を無料にする方針

---

## 検証

実施済み:
- `npm run lint`
- `npx tsc --noEmit`

結果:
- 通過

補足:
- `npm run build` は Google Fonts (`Geist`, `Geist Mono`) の取得失敗で停止
- ローカル環境のネットワーク制約由来で、今回の変更による型エラーではない

---

## 現在の未完了

### 1. progress service への完全移行

残り:
- page 側に残っている activity / 補助クエリの整理
- `src/app/(app)/projects/page.tsx` の `enrichProjectsWithProgress()` を新 service に寄せるか判断

### 2. billing 単一ソース化の残り

残り:
- challenge grading まわりの定数参照化
- credits 表示 UI の用語整理（charts / credits）
- 必要なら `getCreditCost()` への統一

### 3. progress UI 文言の見直し

残り:
- `Got it back` / `Needed a nudge` の最終文言調整
- spec と UI の言葉を揃える

---

## 次セッションのおすすめ順

1. `src/app/(app)/projects/page.tsx` の progress 算出を新 service に寄せるか判断
2. challenge grading の billing 定数参照化
3. progress 画面文言の最終調整
4. 必要なら handoff と spec を再更新
