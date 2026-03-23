# redoCebiv ハンドオフ — 2026-03-20 Progress/Billing Phase 実装設計

作成日: 2026-03-20
ステータス: Design handoff
対象: progress 指標定義、progress service 化、billing 単一ソース化、画面接続

---

## 概要

この handoff は、次フェーズで着手する以下 4 項目の実装設計をまとめたもの。

1. progress 指標定義を `current-implementation-spec.md` に追記
2. `lib/progress/` を作って集計 service 化
3. billing 定数を単一ソース化
4. dashboard / progress / project detail を新 service に接続

このセッションでは実装はまだ行っていない。
目的は、次のセッションで迷わずそのまま実装に入れる設計を残すこと。

この handoff はレビュー指摘を反映して更新済み。
特に以下を明確化した。

- `challenge_grade = 0` は設計ログ更新を前提とした採用であること
- `getUserProgressSummary()` は初回は薄いラッパーとして扱うこと
- billing は「定数定義を先に」「既存コード置換は後で」にすること
- stack 別 progress は `primary stack のみ` へ帰属させる前提で進めること

---

## 1. progress 指標定義

### 基本原則

- submission 件数ではなく **distinct challenge 単位** で集計する
- 同じ challenge を複数回提出しても、進捗カード上は 1 件として扱う
- 集計の基準は `latest submission` ではなく **best grade**
- best grade の優先順位は `self > with_hint > missed`

### 指標定義

| 指標 | 定義 |
|---|---|
| `totalChallenges` | 対象範囲に存在する challenge 総数 |
| `attemptedChallenges` | 1 回以上 submission がある distinct challenge 数 |
| `selfSolvedChallenges` | best grade が `self` の distinct challenge 数 |
| `hintSolvedChallenges` | best grade が `with_hint` で、`self` には未到達の distinct challenge 数 |
| `missedChallenges` | submission はあるが best grade が `missed` の distinct challenge 数 |
| `unattemptedChallenges` | `totalChallenges - attemptedChallenges` |
| `completionRate` | `attemptedChallenges / totalChallenges` |
| `masteryRate` | `selfSolvedChallenges / totalChallenges` |

### 画面別の意味

- dashboard
  - 全プロジェクト横断サマリーを表示
- progress
  - 全体、project 別、stack 別の進捗を表示
- project detail
  - 当該 project の challenge 母数に対する進捗を表示

### 文言方針

- `got back` は曖昧なので、実装時に置換候補を検討する
- 候補:
  - `Solved with hint`
  - `Hinted success`
  - `With help`

### challenge grading の課金値

この handoff では `challenge_grade = 0` を前提にしている。

ただし、過去の `docs/design/decisions.md` 内 ADR-005 には `1cr` の記述が残っているため、
**実装前に設計ログの更新が必要**。

推奨:
- ADR-005 を更新する
- もしくは新規 ADR を追加し、
  「採点はエンゲージメント促進のため無料とする」と明記する

この更新が完了するまでは、`0` は「実装前提の確定候補」とみなす。

### 仕様書反映先

第一候補:
- `docs/design/current-implementation-spec.md`

追記候補セクション:
- `## 9. progress 指標仕様`

必要なら将来的に `docs/design/progress-spec.md` を分離してもよいが、
現時点では `current-implementation-spec.md` へ追記で十分。

---

## 2. progress service 化

### 追加候補ファイル

- `src/lib/progress/types.ts`
- `src/lib/progress/queries.ts`
- `src/lib/progress/service.ts`

### 責務分割

#### `types.ts`

共通の progress 集計型を定義する。

候補:

```ts
export interface ProgressSummary {
  totalChallenges: number
  attemptedChallenges: number
  selfSolvedChallenges: number
  hintSolvedChallenges: number
  missedChallenges: number
  unattemptedChallenges: number
  completionRate: number
  masteryRate: number
}

export interface ProjectProgressRow extends ProgressSummary {
  projectId: string
  projectName: string
  stack: string[]
}

export interface StackProgressRow extends ProgressSummary {
  stackLabel: string
}
```

#### `queries.ts`

Supabase から必要データを取得するだけに絞る。

取得対象:
- user の `projects`
- 対象 project 群の `challenges`
- user の `challenge_submissions`

方針:
- query は加工しない
- authorization は page / route 側の user 前提で行う

注意:
- `getProjectProgress(userId, projectId)` では、query 側でも必ず `userId` ベースの所有権制約を掛ける
- `projectId` のみで challenge / submission を引かないこと
- 実装時は `projects.user_id = userId` を必ず通す

#### `service.ts`

生データを progress 用 view model に変換する。

提供したい関数候補:

```ts
getUserProgress(userId: string)
getUserProgressSummary(userId: string)
getProjectProgress(userId: string, projectId: string)
```

#### `getUserProgressSummary()` の扱い

初回実装では、`getUserProgress()` の `summary` 部分だけを返す**薄いラッパー**として扱う。

イメージ:

```ts
async function getUserProgressSummary(userId: string) {
  const progress = await getUserProgress(userId)
  return progress.summary
}
```

理由:
- まずは集計定義の一貫性を優先したい
- dashboard 専用の軽量 query は、性能上の必要が出てから分ければよい

将来の最適化:
- dashboard のみが重くなった場合に、summary 専用 query を導入する

内部処理:
1. project 一覧取得
2. challenge 一覧取得
3. submission 一覧取得
4. `challenge_id` ごとに grouping
5. best grade 決定
6. summary / projectRows / stackRows を構築

### best grade ルール

```ts
const rank = { missed: 0, with_hint: 1, self: 2 }
```

各 challenge の submission 群に対して、最大 rank の grade を採用する。

### stack 別集計ルール

- project に紐づく `stack: string[]` を使用
- 表示上は project の stack ラベル群を使ってもよい
- 集計上の所属は **primary stack のみ** にする

理由:
- 合計値との整合が取りやすい
- stack 別集計で重複カウントを避けられる

実装ルール:
- `stackRows` では `getPrimaryStack(project.stack)` を使う

推奨:
- この判断を `docs/design/decisions.md` に残す
- 文言は「stack 別 progress は primary stack のみに帰属させる」でよい

---

## 3. billing 定数の単一ソース化

### 前提の確定値

| action | credits |
|---|---|
| `initial_analysis` | 5 |
| `trace_generate` | 1 |
| `change_proposal` | 2 |
| `challenge_grade` | 0 |

前提条件:
- `challenge_grade = 0` を採用する場合は、先に `docs/design/decisions.md` 側の記録を更新すること

### 追加 / 整理候補

- `src/lib/billing/config.ts`
- 必要なら `src/lib/billing/actions.ts`

### 型案

```ts
export type BillingAction =
  | 'initial_analysis'
  | 'trace_generate'
  | 'change_proposal'
  | 'challenge_grade'

export const CREDIT_COSTS: Record<BillingAction, number> = {
  initial_analysis: 5,
  trace_generate: 1,
  change_proposal: 2,
  challenge_grade: 0,
}
```

### 適用ルール

- `consumeCredits()` の第2引数にハードコード値を書かない
- UI の `-5 credits` などの表示も同じ定数を使う
- 残高チェックも同じ定数で行う

### 置換対象候補

- `src/app/api/projects/route.ts`
- `src/lib/traces/service.ts`
- `src/lib/proposals/service.ts`
- challenge grading 周辺
- `src/components/project/ProjectUploadForm.tsx`
- `src/components/change/ChangeIntentForm.tsx`
- 必要に応じて layout / settings の credits 表示

### 導入順の方針

レビュー反映により、billing は最後にまとめて触るのではなく、
**定数定義だけ先に導入する** 形へ変更する。

方針:
- 先に `billing/config.ts` の action / cost 定義を作る
- 既存コードの置換は後段でまとめて行う

これにより、progress 実装中に新しい参照先が増えても、
後で一括統一しやすくなる。

---

## 4. 画面接続方針

### 接続対象

- `src/app/(app)/page.tsx`
- `src/app/(app)/progress/page.tsx`
- `src/app/(app)/projects/[id]/page.tsx`

### 方針

各 page は集計を自前で持たず、progress service を呼ぶだけに寄せる。

#### dashboard (`/`)

使う関数候補:

```ts
getUserProgressSummary(user.id)
```

使い方:
- top cards の全体サマリー
- 「次にやるべき課題」へ使う基礎データ

#### progress (`/progress`)

使う関数候補:

```ts
getUserProgress(user.id)
```

返すもの:
- `summary`
- `projectRows`
- `stackRows`

#### project detail (`/projects/[id]`)

使う関数候補:

```ts
getProjectProgress(user.id, projectId)
```

返すもの:
- 当該 project の `ProgressSummary`

### 実装上の注意

- 既存 page 内で `challenge_submissions` を直接数えているロジックは削除対象
- UI だけ先に維持し、データ供給源だけ差し替えるのが安全
- スタイリング変更はこのフェーズでは最小限でよい

---

## 5. 実装順の推奨

### Step 1
- `current-implementation-spec.md` に progress 指標仕様を追記

### Step 1.5
- `billing/config.ts` の action / cost 定義だけ先に確定
- `challenge_grade = 0` の根拠を `docs/design/decisions.md` に記録
- `stack 別 progress は primary stack のみ` の判断も `docs/design/decisions.md` に記録

### Step 2
- `src/lib/progress/types.ts` 作成
- `src/lib/progress/queries.ts` 作成
- `src/lib/progress/service.ts` 作成

### Step 3
- `progress/page.tsx` を新 service に接続

### Step 4
- `page.tsx` を新 service に接続

### Step 5
- `projects/[id]/page.tsx` を新 service に接続

### Step 6
- billing 定数を `billing/config.ts` に統一

### Step 7
- `npm run lint`

---

## 6. Done の定義

このフェーズの Done は以下。

- progress の集計が submission 件数ではなく distinct challenge ベースになっている
- dashboard / progress / project detail の進捗数字が同じ定義で揃っている
- `consumeCredits(..., 数字)` のハードコードが主要経路から消えている
- progress 指標定義が仕様書に記録されている
- `npm run lint` が通る

---

## 7. 未決定事項

### `got back` 文言をどう置き換えるか

UX 表現の最終決定は未了。
実装時に UI 表示の候補を見て決めるとよい。

### dashboard summary を専用 query にするか

初回は不要。
まずは `getUserProgressSummary()` を薄いラッパーで実装し、
必要が出たら summary 専用 query を導入する。

---

## 8. 関連ドキュメント

- `docs/design/current-implementation-spec.md`
- `docs/design/decisions.md`
- `docs/handoffs/rv_20260320_stack-expansion-progress-design_handoff.md`

---

## 補足

この handoff は「未実装タスクの設計書」であり、
実装完了報告ではない。
