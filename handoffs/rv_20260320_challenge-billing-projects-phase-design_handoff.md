# redoCebiv ハンドオフ — 2026-03-20 Challenge/Billing/Projects Phase 実装設計

作成日: 2026-03-20
ステータス: Design handoff
対象: projects 一覧整理、challenge 仕様残件、challenge billing 統一

---

## 概要

この handoff は、progress/billing phase の次に着手する 3 フェーズの実装設計をまとめたもの。

対象は以下。

1. `projects/page.tsx` の旧 progress 集計整理
2. `challenge` 仕様残件の修正
3. `challenge grading` を含む billing/config 完全統一

この段階では実装はまだ行っていない。
目的は、次セッションで迷わず優先順どおりに着手できる設計を残すこと。

---

## Phase 1. Projects 一覧整理

### 目的

`projects/page.tsx` に残っている旧 progress 集計や重複ロジックを整理し、dashboard / progress / project detail と同じ定義へ揃える。

これは今すぐユーザーに見える数字のズレを解消するフェーズとして最優先に置く。

### 対象ファイル

- `src/app/(app)/projects/page.tsx`
- 必要なら `src/lib/progress/service.ts`

### 設計方針

#### 1. 一覧画面の進捗値は progress service から取る

一覧画面独自の progress 計算を持たせない。

使う候補:

- `getUserProgress(userId)`

#### 2. `enrichProjectsWithProgress` を廃止する

現状の課題:

- trace 数が join ベースで、現在の `zip_hash` 基準とずれている
- solved 数が `neq('grade', 'missed')` ベースで、best grade 定義と一致していない

方針:

- `getUserProgress(userId).projectRows` を project 一覧へ merge する
- ready project は service の数値を使用
- non-ready project は progress を 0 扱いにする

#### 3. 数字の source をそろえる

特に以下を service の値に統一する。

- challenge 総数
- solved 数
- trace 数
- completion/mastery の基準

### Done 条件

- `projects/page.tsx` が独自の progress 集計を持たない
- project detail / progress / dashboard と project ごとの数字が一致する

---

## Phase 2. Challenge 仕様残件

### 目的

Challenge 体験でまだ残っている UI/型/説明生成の不整合を閉じる。

この handoff 作成時点で、以下はすでに対応済み。

- `ChallengeView.tsx` の difficulty 1-5 対応
- `submit/route.ts` の `file_selection / code_choice` 採点分岐
- explanation の再利用条件が「同じ grade のときのみ」であること

今回の実装対象は残件に絞る。

### 対象ファイル

- `src/lib/challenges/types.ts`
- `src/components/challenge/ChallengeView.tsx`
- `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts`
- `src/app/(app)/projects/[id]/page.tsx`

### 設計方針

#### 1. 共通型を導入する

候補:

```ts
export type ChallengeFormat = 'file_selection' | 'code_choice'
export type ChallengeDifficulty = 1 | 2 | 3 | 4 | 5
export interface ChallengeAnswer {
  correct_files: string[]
  correct_code: string
  explanation: string
  change_type: string
  related_examples: string[]
  choices?: string[]
  correct_index?: number
  current_code?: string
}
```

候補配置:

- `src/lib/challenges/types.ts`

狙い:

- UI 分岐
- submit 判定
- answer の解釈

のすべてで同じ型を使う。

#### 2. project detail の difficulty 表示を 1-5 にそろえる

現状、`projects/[id]/page.tsx` のローカル定義が 1-3 のみ。

方針:

- `ChallengeView.tsx` と同じ 1-5 表示に揃える
- fallback に依存しない

#### 3. `code_choice` explanation の入力形式を直す

現状の課題:

- `code_choice` の explanation 生成で `selectedFiles: []`
- `correctFiles: answer.correct_files`

を渡しており、評価軸と説明用コンテキストが一致していない。

狙い:

- `code_choice` 時は choice ベースの文脈を explanation に渡す
- 少なくとも `selectedIndex / correctIndex / choices / currentCode` を使える形にする

実装案:

- `generateExplanation()` の引数を format-aware にする
- もしくは challenge submit 側で explanation 用のテキスト文脈を組み立てる

初回は差分を小さくするため、`generateExplanation()` の入力拡張が有力

### Done 条件

- `ChallengeAnswer` が重複定義されていない
- `projects/[id]/page.tsx` の difficulty 表示が 1-5 で一致する
- `code_choice` の explanation が file-selection 前提の引数に依存しない

---

## Phase 3. Billing/config 完全統一

### 目的

課金値と action 名を `billing/config.ts` に一本化し、challenge grading を含めて source of truth を完成させる。

### 前提の確定値

| action | credits |
|---|---|
| `initial_analysis` | 5 |
| `trace_generate` | 1 |
| `change_proposal` | 2 |
| `challenge_grade` | 0 |

### 対象ファイル

- `src/lib/billing/config.ts`
- challenge UI 文言
- grading 関連の表示箇所

### 設計方針

#### 1. `BillingAction` を唯一の action 定義にする

例:

```ts
export type BillingAction =
  | 'initial_analysis'
  | 'trace_generate'
  | 'change_proposal'
  | 'challenge_grade'
```

#### 2. grading は表示・文言の source を統一する

submit route では grading 課金が存在しないため、今回の主対象は UI と文言。

以下は config 参照に寄せる。

- UI 表示
- エラーメッセージ内の数値

#### 3. `challenge_grade = 0` の設計根拠を明文化する

これは実装前に設計ログ更新が必要。

推奨:

- `design/decisions.md` に記録を追記する

候補文言:

- 採点は継続利用の入口であり、エンゲージメント促進のため無料とする

### Done 条件

- `5 / 1 / 2 / 0` が config 以外に残らない
- action 名の揺れがない
- grading も config 経由で参照している

---

## Phase 3. Projects 一覧整理

### 目的

`projects/page.tsx` に残っている旧 progress 集計や重複ロジックを整理し、dashboard / progress / project detail と同じ定義へ揃える。

### 対象ファイル

- `src/app/(app)/projects/page.tsx`
- 必要なら `src/lib/progress/service.ts`

### 設計方針

#### 1. 一覧画面の進捗値は progress service から取る

一覧画面独自の progress 計算を持たせない。

使う候補:

- `getUserProgress(userId)`
- 必要なら一覧用の軽量 selector

#### 2. 一覧画面にしかない集計ヘルパーを削る

狙い:

- distinct challenge 基準
- best grade 基準
- project 別 progress の定義

を他画面と一致させる。

#### 3. 数字の source をそろえる

特に以下が一致していることを確認する。

- challenge 総数
- solved 数
- trace 数
- completion/mastery の基準

### 注意点

- UI のために必要な project 一覧取得は page 側でよい
- ただし progress 計算は page 側で再実装しない
- 一覧画面で将来パフォーマンスが問題になれば、軽量な list 用 service を別追加してもよい

### Done 条件

- `projects/page.tsx` が独自の progress 集計を持たない
- project detail / progress / dashboard と project ごとの数字が一致する

---

## 推奨実装順

1. Phase 1 の projects 一覧整理
2. Phase 2 の challenge 型集約と explanation 修正
3. Phase 3 の config / 表示統一

理由:

- まず今見えている trace/solved のズレを消したい
- その後に challenge 体験の残件を閉じたい
- billing は変更量が小さいため最後でよい

---

## 検証観点

### Phase 1

- 一覧画面と project detail の trace 数が一致する
- progress 画面と一覧画面の challenge 数 / solved 数が一致する

### Phase 2

- `projects/[id]/page.tsx` の difficulty 4-5 が正しく表示される
- `code_choice` challenge の explanation 品質が形式不一致で落ちない
- `ChallengeAnswer` が共通型に集約されている

### Phase 3

- grading に関わる表示が config 参照に統一されている
- `challenge_grade = 0` 前提でも UI が破綻しない

共通:

- `npm run lint`
- `npx tsc --noEmit`

---

## 次セッションの着手点

最初の 1 手は Phase 1 の一覧整理から入るのがよい。

具体的には以下。

1. `projects/page.tsx` の `enrichProjectsWithProgress` を外す
2. `getUserProgress(userId)` の `projectRows` と merge する
3. 一覧の trace / challenge / solved 数を service 値に統一する

この 3 点を押さえたうえで修正に入る。
