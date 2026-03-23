# redoCebiv ハンドオフ — 2026-03-20 実装レビュー / 仕様ズレ・保守性・改善提案

作成日: 2026-03-20
ステータス: Review only
対象: 現在の redoCebiv 実装全体のレビュー結果

---

## 概要

ここまでの実装コードをレビューし、以下の観点で確認した。

- 仕様を満たしていない箇所
- バグやエラーにつながるリスク
- メンテナンス性を落としている箇所
- 不要なハードコード

今回のセッションではコード変更は行っていない。
目的は、次にどこから直すと品質と開発速度が最も上がるかを明確にすること。

---

## 結論

今回のレビューで優先度が高いのは次の4点。

1. challenge 新仕様（`format`, `difficulty 4-5`）の保存・表示・採点の接続不備
2. billing 単一ソースと実消費値の不一致
3. trace / proposal まわりの課金・保存フローの不整合
4. progress 指標の定義の甘さと重複カウント

redoCebiv は「理解できるようになった実感」が価値の中心なので、
見た目の改善より先に、
「正しい challenge が出る」
「正しい credits が減る」
「正しい progress が出る」
を固める必要がある。

---

## 仕様を満たしていない箇所

### 1. `code_choice` challenge が保存時に失われている

関連:
- `src/lib/anthropic/analyze.ts`
- `src/lib/inngest/functions/analyze-project.ts`
- `src/components/challenge/ChallengeView.tsx`
- `supabase/migrations/010_plan_billing.sql`

内容:
- AI 生成では difficulty 4-5 に対して `format: 'code_choice'` を返している
- しかし `analyze-project.ts` の challenges insert で `format` を保存していない
- DB default により `file_selection` として保存される可能性が高い

影響:
- 4択課題用 UI が正しく出ない
- 仕様上は導入済みでも、実際の体験は旧仕様のままになる

必要対応:
- challenge insert に `format` を追加
- 必要なら既存データ backfill

---

### 2. difficulty 4-5 表示が project detail に未対応

関連:
- `src/app/(app)/projects/[id]/page.tsx`

内容:
- challenge difficulty は 1-5 に拡張されているが、
  プロジェクト詳細の `DIFFICULTY_STARS` は 1-3 のみ

影響:
- 一覧表示で difficulty 4-5 が正しく見えない
- 新仕様を UI が表現できていない

必要対応:
- difficulty 表示定義を共通化
- challenge 一覧・詳細・proposal で同じ定義を参照する

---

## バグやエラーなどのリスクがある箇所

### 3. billing 設定と実消費値がズレている

関連:
- `src/lib/billing/config.ts`
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/change-proposals/route.ts`
- `src/components/project/ProjectUploadForm.tsx`
- `src/components/change/ChangeIntentForm.tsx`

内容:
- `CREDIT_COSTS` では:
  - analyze = 10
  - proposal = 1
- しかし実装側は:
  - upload API = 5
  - proposal API = 2
- UI 文言も `-5 charts` などの古い値が残る

影響:
- credits の信頼性が落ちる
- 仕様変更時に API / UI /設定の三重ズレが起きる

必要対応:
- route handler の消費量を `CREDIT_COSTS` 参照に統一
- UI 文言も同じ定義から出す
- `charts` / `credits` の用語も統一する

---

### 4. proposal はファイル取得前に課金している

関連:
- `src/app/api/projects/[id]/change-proposals/route.ts`

内容:
- `consumeCredits()` が `project_files` 取得より前に呼ばれている
- trace 側では同種のバグを修正済みだが、proposal 側には残っている

影響:
- ファイル不在・取得失敗でも credits が減る可能性

必要対応:
- trace と同様に、必要データ確認後に課金
- もしくは補償処理を追加

---

### 5. trace 生成が page と API で二重実装されている

関連:
- `src/app/(app)/projects/[id]/trace/[ucId]/page.tsx`
- `src/app/api/projects/[id]/usecases/[ucId]/trace/route.ts`

内容:
- API 側には
  - ファイル確認後課金
  - 重複時返金
  - 既存 trace 再利用
  がある
- page 側は旧フローのままで
  - 先に課金
  - insert 失敗補償なし
  - race condition 対応なし

影響:
- 経路によって挙動が変わる
- 片側だけ修正され続けて保守負債になる

必要対応:
- trace 生成を service 層に一本化
- page と API のどちらも同じ service を使う

---

### 6. trace insert error を広く「重複扱い」している

関連:
- `src/app/api/projects/[id]/usecases/[ucId]/trace/route.ts`

内容:
- insert error が出たらすべて返金 + 既存 trace を返す実装になっている
- UNIQUE 制約違反だけを特別扱いしたいはずだが、他の DB エラーも巻き込む

影響:
- 本当の障害が見えにくくなる
- データ不整合や保存失敗を成功扱いしてしまう可能性

必要対応:
- Postgres error code を見て UNIQUE 違反だけ分岐
- それ以外は 500 とログ出力

---

### 7. progress の数値が「成長」ではなく「提出回数」に引っ張られている

関連:
- `src/app/(app)/progress/page.tsx`

内容:
- `totalChallenges` が challenge 総数ではなく submission 件数
- `gotBack` も distinct challenge ではなく `grade='self'` の提出回数
- 同じ課題を複数回解くと成長したように見える

影響:
- MVP の核である成長トラッキングの意味がぶれる

必要対応:
- 指標定義を整理
  - challenge total
  - attempted distinct
  - solved latest
  - solved best
- 画面でどの定義を見せるかを明文化

---

### 8. challenge explanation 再利用条件がまだ粗い

関連:
- `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts`

内容:
- 今は `grade` が一致すれば explanation を再利用する
- ただし `selectedFiles` / `selectedIndex` / `answerText` の違いは見ていない

影響:
- 同じ grade でも全く違う誤答に同じ explanation を返す可能性

必要対応:
- cache key を厳密化
  - `challengeId`
  - `grade`
  - `selected_files`
  - `selected_index`
 など

---

## コードのメンテナンス性を落としている箇所

### 9. page に責務が集まりすぎている

代表:
- `src/app/(app)/page.tsx`
- `src/app/(app)/progress/page.tsx`
- `src/app/(app)/projects/[id]/page.tsx`

内容:
- query
- 集計
- view model 組み立て
- 大量の inline style
が同じファイルに混在している

影響:
- 指標変更や UI 調整の影響範囲が広い
- 同種ロジックが複製されやすい

必要対応:
- `features/*/queries.ts`
- `features/*/services.ts`
- `features/*/components/*`
へ分離

---

### 10. stack リファレンス全文が client bundle に入る構造

関連:
- `src/components/stack/StackBadge.tsx`
- `src/lib/stacks/reference.ts`

内容:
- `StackBadge` は client component
- そこから巨大な `reference.ts` を直接 import している

影響:
- クライアント JS が重くなる
- stack 辞書が増えるほど初期負荷が増える

必要対応:
- modal 用データを軽量化
- server で必要部分だけ渡す
- もしくは stack detail を別 fetch / route に逃がす

---

### 11. `as unknown as` が progress まわりに多い

関連:
- `src/app/(app)/progress/page.tsx`

内容:
- relation 型が取れておらず、複数箇所で強引な cast が残っている

影響:
- relation shape が変わると静かに壊れる
- 読みづらい

必要対応:
- Supabase generated types 導入
- query return type を helper に閉じ込める

---

## 不要なハードコード

### 12. billing / terminology のハードコード

例:
- `5`, `2`, `1`
- `charts remaining`
- `Not enough charts to navigate.`
- `Start analysis (−5 charts)`

関連:
- `src/app/api/projects/route.ts`
- `src/app/api/projects/[id]/change-proposals/route.ts`
- `src/components/project/ProjectUploadForm.tsx`
- `src/components/change/ChangeIntentForm.tsx`
- `src/app/(app)/layout.tsx`

必要対応:
- cost
- label
- error copy
- usage noun
を billing config に寄せる

---

### 13. challenge difficulty 表示の重複ハードコード

関連:
- `src/app/(app)/projects/[id]/page.tsx`
- `src/components/challenge/ChallengeView.tsx`
- `src/components/change/ProposalCard.tsx`

内容:
- 難易度星表現が複数箇所に散っている
- difficulty 1-5 への追従が画面ごとにズレる

必要対応:
- `src/lib/challenges/config.ts` などに共通化

---

### 14. 対応スタックの表現が実装能力以上に広い

関連:
- `src/components/project/ProjectUploadForm.tsx`
- `src/lib/zip/index.ts`

内容:
- UI は Web / Mobile / Backend 全般対応のように見える
- しかし解析優先ロジックは `src|app` の JS/TS 系前提が強い

影響:
- ユーザー期待とのズレ
- 精度問題が「バグ」に見える

必要対応:
- 今は対応範囲を明確に狭める
  または
- 言語別 selector / analyzer の導入

---

## lint / 開発衛生

現状 `npm run lint` は失敗している。

内容:
- `src/components/project/AnalyzingStatus.tsx`
  - `<a>` 利用
- `src/app/(auth)/login/page.tsx`
  - 未使用 import

優先度は高くないが、
「レビュー後に残る明確な不整合」として早めに潰してよい。

---

## ここからの改善提案

### 提案 1. 仕様接続を最優先で直す

対象:
- challenges.format 保存
- difficulty 4-5 表示
- billing cost の単一ソース接続

理由:
- 今ある仕様が正しく動かない状態を先に直すべき

---

### 提案 2. trace / proposal / challenge submit を service 化する

候補:

```txt
src/features/traces/service.ts
src/features/proposals/service.ts
src/features/challenges/service.ts
```

役割:
- validate
- charge
- generate
- persist
- compensate

理由:
- route / page の二重実装を止める
- 返金や重複処理のルールを一箇所にまとめられる

---

### 提案 3. progress 指標の意味を定義し直す

決めるべきこと:
- challenge total = 課題総数か submission 数か
- solved = latest か best か
- got back = self の distinct challenge 数か

理由:
- redoCebiv の価値は「成長実感」なので、数字の意味が最重要

---

### 提案 4. config / constant の共通化を進める

候補:

```txt
src/lib/billing/config.ts
src/lib/challenges/config.ts
src/lib/ui/copy.ts
```

対象:
- costs
- plan labels
- difficulty labels
- grade icons
- user-facing error copy

---

### 提案 5. page を薄くする

方針:
- page は
  - load data
  - pass props
 だけに寄せる
- 集計は service / query に寄せる

理由:
- 変更時の影響範囲を小さくできる

---

### 提案 6. 対応スタック方針を明文化する

選択肢:
- A. 当面は Next.js / React / TypeScript 中心に絞る
- B. stack ごとに analyzer を増やして本当に対応範囲を広げる

現状は A 寄りの実装なのに、UI は B のように見える。
このズレは早めに解消すべき。

---

## 次セッションで着手するならおすすめ順

1. `challenges.format` 保存漏れ修正
2. billing cost を API / UI 全部 `CREDIT_COSTS` 参照に統一
3. proposal の課金タイミング修正
4. trace service 一本化
5. progress 指標の distinct 化 / 定義見直し
6. lint 解消

---

## 補足

今回のレビューで特に重要だったのは、
「個別バグ」よりも
「仕様追加後に各層が一緒に更新されない構造」
がまだ残っている点。

redoCebiv は今後も
- challenge 形式追加
- stack 対応追加
- 課金仕様変更
が起きやすいプロダクトなので、
そこに強い構造へ寄せるのが中長期で効く。
