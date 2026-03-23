# Handoff: 対応スタック拡大 + 課金安全化

**日付**: 2026-03-20
**ブランチ**: feature/copy-update
**担当**: Claude Code（Sonnet 4.6）
**ステータス**: 実装完了・未コミット

---

## 実装サマリー

### 1. 対応スタック拡大の土台（stack-prompts.ts）

`src/lib/anthropic/stack-prompts.ts` を新設。
Flutter / Swift / Rails / Python / Vue / Nuxt / Svelte / SvelteKit ごとに
prompt 文脈（appDescription / 各種 guidance）と few-shot 例を一元管理する。

差し込み先:
- `analyze.ts`（usecase 抽出・challenge 生成）
- `trace.ts`（trace 生成プロンプト）
- `proposal.ts`（proposal 生成プロンプト）
- `grade.ts`（explanation 生成プロンプト）

### 2. primary stack の明示化（primary.ts）

`src/lib/stacks/primary.ts` を新設。

```
PRIMARY_STACK_ORDER:
  Flutter > Swift > Ruby on Rails > Python
  > Vue > Nuxt > Svelte > SvelteKit > Next.js > React
```

`getPrimaryStack(projectStack)` が優先順位に従って代表 stack を1つ返す。
優先順に載っていない場合は `projectStack[0]` にフォールバック。

`zip/index.ts` と `stack-prompts.ts` の両方が同じ関数を参照するため、
ファイル選定と prompt の代表 stack が常に一致する。

**補足**: `Next.js` / `React` は `PRIMARY_STACK_ORDER` に含まれているが、
`stack-prompts.ts` と `zip/index.ts` には明示ブランチがなく default にフォールスルーする。
default が Next.js/React の挙動のため意図通り。

### 3. stack-aware ファイル選定（zip/index.ts）

`selectFilesForAnalysis()` が `primaryStack` に応じてファイル優先度を切り替える。
Flutter なら `lib/*.dart` が priority1、Swift なら `Sources/` `Views/` 以下が priority1、など。

以前は Web 系（`src/app/*.tsx` 等）しか priority1 にならなかった。

### 4. trace / proposal の課金安全化（service.ts ×2）

`src/lib/traces/service.ts` / `src/lib/proposals/service.ts` を新設。

共通フロー:
```
project 確認 → file 確認 → 課金 → AI 生成（失敗時返金）→ DB 保存（失敗時返金）
```

解消した問題:
- proposal の先行課金（file 確認前に課金していた）
- AI 生成失敗時の未返金
- trace 保存失敗時の二重返金（UNIQUE 違反 + existing null のケース）
- trace insert error を全部「重複扱い」していた（23505 のみ分岐）

route/page は service を呼ぶ薄い構成に変更:
- `trace/route.ts`（約 −115 行）
- `change-proposals/route.ts`（約 −50 行）
- `trace/[ucId]/page.tsx`（約 −65 行）

### 5. lint 修正

- `AnalyzingStatus.tsx`: `<a>` → `<Link>`
- `login/page.tsx`: 未使用 import 削除

---

## 残っている既知の軽微な点

- `consumeCredits(userId, 2, ...)` / `consumeCredits(userId, 5, ...)` の値がまだハードコード。
  billing 単一ソース化タスク（Step 4）で `CREDIT_COSTS` 参照に統一する。
- `primary.ts` の `Next.js` / `React` エントリに対応する stack-prompts.ts ブランチがない。
  default が Next.js/React 挙動なので機能的には問題なし。コメント追加を推奨。

---

## 次のステップ

### 優先①: progress 指標の再設計

**背景**: 現状の `totalChallenges` は submission 件数であり、distinct challenge 数ではない。
同じ課題を繰り返すと成長したように見える。

**確定仕様**（Yasu 確認済み）:
- `challenge total` = challenges テーブルの総数
- `attempted` = submission が1件以上ある distinct challenge 数
- `got back` = 最新 grade が `self` の distinct challenge 数

**実装方針**:
- 集計ロジックを `progress/page.tsx` のインライン から service / query に分離
- dashboard / progress / project detail で同じ定義を使う

### 優先②: billing 単一ソース化

`consumeCredits` に渡している数値（2, 5, 1）を `CREDIT_COSTS` 参照に統一。

確定値（Yasu 確認済み）:
- analyze = 5（`CREDIT_COSTS.analyze` を 10→5 に修正）
- proposal = 2（`CREDIT_COSTS.proposal` を 1→2 に修正）
- trace = 1（正しい）

修正対象:
- `src/lib/billing/config.ts`（CREDIT_COSTS の値修正）
- `src/lib/traces/service.ts`（1 → `CREDIT_COSTS.trace`）
- `src/lib/proposals/service.ts`（2 → `CREDIT_COSTS.proposal`）
- `src/app/api/projects/route.ts`（5 → `CREDIT_COSTS.analyze`）
- UI 文言（`-5 charts` など）も config 参照に

### 参考: primary stack 設計の明文化

`decisions.md` に以下を追記することを推奨:
- なぜ primary stack が必要か（selector と prompt のズレ防止）
- 現在の優先順位（PRIMARY_STACK_ORDER）
- 新 stack 追加時の更新箇所（primary.ts / stack-prompts.ts / zip/index.ts）
