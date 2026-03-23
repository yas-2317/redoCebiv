# redoCebiv 現行実装仕様

最終更新: 2026-03-20
バージョン: 0.2

---

## 目的

この文書は、2026-03-20 時点の redoCebiv 実装状態を仕様として固定し、今後の設計・レビュー・追加実装の基準にするための記録である。

MVP 初稿から更新された主な論点は以下。

- 対応スタックを Next.js / React 系限定から拡張方向へ切り替えた
- stack-aware prompt と file selection を導入した
- trace / proposal の業務ロジックを service に集約した
- 課金後の AI 失敗・保存失敗時に返金補償を入れた
- 複数 stack 検出時の primary stack 解決を明示した

---

## 1. 対応スタック方針

### 1-1. 現在の方針

MVP の主戦場は引き続き Next.js / React / TypeScript 系だが、実装は多スタック拡張を前提とした構造へ移行している。

現時点で prompt / file selection 上で明示対応している stack:

- Flutter
- Swift
- Ruby on Rails
- Python
- Vue / Nuxt
- Svelte / SvelteKit
- Next.js / React 系（default web）

### 1-2. primary stack 解決

複数 stack が検出された場合、selector と prompt が同じ代表 stack を参照する。

優先順位:

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
11. 上記に該当しない場合は `projectStack[0]`
12. それもない場合は generic web fallback

実装箇所:

- [primary.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/stacks/primary.ts)

---

## 2. stack-aware AI 仕様

### 2-1. 共通コンテキスト

stack ごとの AI 文脈は [stack-prompts.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/anthropic/stack-prompts.ts) に集約する。

`StackPromptContext` が保持するもの:

- `appDescription`
- `stackSummary`
- `usecaseGuidance`
- `challengeGuidance`
- `traceGuidance`
- `proposalGuidance`
- `gradingPatternLabel`
- `examples`

### 2-2. few-shot 方針

各 stack は以下の例を持つ。

- challenge file selection 例
- challenge code choice 例
- trace 例
- proposal 例

few-shot は抽象プレースホルダーではなく、stack ごとの具体コード例を使う。

### 2-3. 適用箇所

- ユースケース抽出: [analyze.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/anthropic/analyze.ts)
- 課題生成: [analyze.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/anthropic/analyze.ts)
- トレース生成: [trace.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/anthropic/trace.ts)
- 変更候補生成: [proposal.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/anthropic/proposal.ts)
- 採点解説: [grade.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/anthropic/grade.ts)

---

## 3. ファイル選定仕様

### 3-1. 基本方針

AI に渡すファイルは、`selectFilesForAnalysis()` が primary stack に応じて優先度を付けて選定する。

実装箇所:

- [index.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/zip/index.ts)

### 3-2. 除外対象

以下は基本的に AI 入力から除外する。

- test / spec / story
- `.d.ts`
- `node_modules`, `.git`, `.next`, `dist`, `build`, `out`
- lock file, source map, minified assets
- バイナリファイル

### 3-3. stack 別の優先例

- Flutter: `lib/`, `bin/`, `pubspec.yaml`
- Swift: `.swift`, `Sources`, `Views`, `ViewModels`, `Models`, `Services`, `Features`
- Rails: `app/`, `config/routes.rb`, `db/schema.rb`
- Python: `app/`, `src/`, `project/`, `templates/`, `.py`
- Vue / Nuxt: `pages/`, `components/`, `composables/`, `stores/`, `.vue`
- Svelte / SvelteKit: `src/`, `routes/`, `.svelte`
- Default web: `src/`, `app/` の `ts/js/tsx/jsx`

---

## 4. trace 仕様

### 4-1. 実行責務

trace の業務ロジックは [traces/service.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/traces/service.ts) に集約する。

API route と page route は同じ service を呼ぶ。

### 4-2. 実行順

1. project 取得
2. usecase 取得
3. trace キャッシュ確認
4. 関連 file 取得
5. クレジット消費
6. AI で trace 生成
7. DB 保存
8. 必要時に返金補償

### 4-3. 補償ルール

- `INSUFFICIENT_CREDITS`: 未生成
- `TRACE_GENERATION_FAILED`: 返金する
- `TRACE_SAVE_FAILED`: 返金する
- UNIQUE 制約違反 (`23505`): 返金後、既存 trace を返す

### 4-4. page 側のエラー表示

trace page は以下の扱いをする。

- `INSUFFICIENT_CREDITS`: 専用メッセージ表示
- `TRACE_GENERATION_FAILED` / `TRACE_SAVE_FAILED`: error boundary へ送る
- `PROJECT_NOT_FOUND` / `USECASE_NOT_FOUND` / `FILES_NOT_FOUND`: `notFound()`

---

## 5. proposal 仕様

### 5-1. 実行責務

proposal の業務ロジックは [proposals/service.ts](/Users/chikamayasufumi/Claude_Workspace/projects/redoCebiv/src/lib/proposals/service.ts) に集約する。

route は service の結果を HTTP ステータスへマップするだけにする。

### 5-2. 実行順

1. project 取得
2. project files 取得
3. stack-aware file selection
4. クレジット消費
5. AI で proposal 生成
6. DB 保存
7. 必要時に返金補償

### 5-3. 補償ルール

- `FILES_NOT_FOUND`: 未課金
- `INSUFFICIENT_CREDITS`: 未生成
- `PROPOSAL_GENERATION_FAILED`: 返金する
- `PROPOSAL_SAVE_FAILED`: 返金する

---

## 6. 課金・補償の現状

### 6-1. 既に補償済みの経路

- 初期解析 enqueue 失敗時
- trace 生成失敗時
- trace 保存失敗時
- proposal 生成失敗時
- proposal 保存失敗時

### 6-2. 未完了の論点

課金値そのものの単一ソース化は未完了。

現時点では一部の `consumeCredits()` 呼び出しがハードコードのままであり、将来的には `billing/config.ts` を唯一の参照元に寄せる必要がある。

---

## 7. progress 指標仕様

### 7-1. 基本原則

- progress カードは submission 件数ではなく **distinct challenge 単位** で集計する
- 同じ challenge を複数回提出しても、集計上は 1 件として扱う
- challenge の達成状態は `latest submission` ではなく **best grade** を使う
- best grade の優先順位は `self > with_hint > missed`

### 7-2. 指標定義

- `totalChallenges`
  - 対象範囲に存在する challenge 総数
- `attemptedChallenges`
  - 1 回以上 submission がある distinct challenge 数
- `selfSolvedChallenges`
  - best grade が `self` の distinct challenge 数
- `hintSolvedChallenges`
  - best grade が `with_hint` で、`self` には未到達の distinct challenge 数
- `missedChallenges`
  - submission はあるが best grade が `missed` の distinct challenge 数
- `unattemptedChallenges`
  - `totalChallenges - attemptedChallenges`
- `completionRate`
  - `attemptedChallenges / totalChallenges`
- `masteryRate`
  - `selfSolvedChallenges / totalChallenges`

### 7-3. stack 別集計

- stack 別 progress は `getPrimaryStack(project.stack)` が返す 1 つの stack のみに帰属させる
- project を複数 stack に重複所属させない

---

## 8. 現在の既知制約

- progress 指標はまだ設計と集計ロジックの整理余地がある
- `PROJECT_NOT_READY` の trace page UX は専用メッセージ未対応
- 対応 stack は拡張したが、品質保証は stack ごとの実データ確認がまだ必要
- multi-stack プロジェクトでは primary stack 優先のため、副次 stack の文脈は補助的にしか使われない

---

## 9. 次の設計対象

次に優先して設計・実装する対象は以下。

1. progress 指標の定義整理
2. progress 集計ロジックの service / query 分離
3. billing 値の単一ソース化
4. primary stack 優先順位の設計書反映
5. stack ごとの品質確認と例追加
