# redoCebiv ハンドオフ — 2026-03-19 コードレビュー / 構成改善メモ

作成日: 2026-03-19
完了日: 2026-03-19
ステータス: Review only
対象: 現行 Next.js / Supabase / Inngest / Anthropic 実装の問題点整理と改善方針

## 概要

現状の実装を全体レビューし、次フェーズで優先して手を入れるべき問題点と、
現実的なリファクタ方針を整理した。

今回のセッションではコード変更は行っていない。
目的は「何から直すと product trust と開発速度が上がるか」を明確にすること。

---

## 結論

最優先で直すべきなのは UI の見た目ではなく、以下の3点。

1. 進捗・学習結果の集計精度
2. challenge grading / explanation の正しさ
3. upload → analyze 起動失敗時の補償

この3点は redoCebiv のコア価値である
「自分の理解が進んでいる実感」と「信頼できるフィードバック」に直結する。

---

## 重要な問題点

### 1. solved / progress 集計が不正確

- `src/app/(app)/projects/[id]/page.tsx`
  - `challenge_submissions` を `user_id` ベースで取得しており、対象 project の challenge に絞れていない
  - 他 project の提出履歴まで混ざるため `solvedCount` が膨らむ
- `src/app/(app)/projects/page.tsx`
  - `enrichProjectsWithProgress()` が distinct challenge 数ではなく submission 件数を数えている
  - 同じ challenge を複数回提出すると進捗が増える

影響:
- 進捗バーが信用できない
- 「理解できるようになった実感」の指標が壊れる

推奨対応:
- solved は `challenge_id` 単位で distinct 集計に変更
- project detail の submissions 取得は `challenge_id -> project_id` で対象 project に限定

---

### 2. challenge grading が甘い

- `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts`
  - `selectedFiles.some(...)` で判定している
  - `correct_files` が複数ある課題でも1ファイル当てれば正解扱いになる

影響:
- 難易度2, 3 の課題で評価の信頼性が落ちる
- 成長トラッキングの精度が崩れる

推奨対応:
- `correct_files` をすべて含んだときのみ full match
- 部分一致は `with_hint` とは別の扱いにするか、少なくとも missed と区別する設計を検討
- grading ロジックを route handler 直書きではなく service 化

---

### 3. explanation の再利用ロジックが誤る

- `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts`
  - 過去 submission の `explanation` があれば今回の grade や selectedFiles に関係なく再利用

影響:
- 前回 missed、今回 self のケースでも古い explanation が返る可能性がある
- 学習フィードバックの一貫性が壊れる

推奨対応:
- explanation の再利用条件を厳格化
- 最低でも `grade` と `selected_files` が一致する場合のみ再利用
- もしくは毎回生成し、コスト最適化は別途キャッシュキー設計で行う

---

### 4. upload 後に analyze 起動失敗すると課金済みのまま止まりうる

- `src/app/api/projects/route.ts`
  - upload 成功後に課金
  - `status='analyzing'` 更新後に `inngest.send()`
  - `inngest.send()` 失敗時の rollback / credit refund / status rollback がない

影響:
- user が credits を失う
- project が `analyzing` のまま残る可能性がある
- サポート対応コストが増える

推奨対応:
- `inngest.send()` を try/catch で保護
- 失敗時は:
  - storage cleanup
  - project 削除 or `error` 更新
  - credit refund or consume 前の設計に戻す
- 可能なら「job enqueue 成功後に課金」か、補償トランザクションを設ける

---

### 5. plan 定義が DB と UI で不整合

- DB: `supabase/migrations/001_initial.sql`
  - `free`, `lite`, `team`
- UI:
  - `src/app/(app)/page.tsx`
  - `src/app/(app)/progress/page.tsx`
  - `free`, `pro` を前提

影響:
- `lite` / `team` の表示が壊れる
- credit 上限やラベルが誤る

推奨対応:
- `src/lib/billing/config.ts` のような単一ソースを作る
- DB enum / check 制約と UI 表示を同じ定義から揃える

---

### 6. ページに責務が集まりすぎている

代表例:
- `src/app/(app)/page.tsx` 394 lines
- `src/app/(app)/projects/[id]/page.tsx` 301 lines
- `src/app/(app)/progress/page.tsx` 291 lines

現状:
- Server Component が
  - Supabase query
  - 集計
  - view model 組み立て
  - 大量の inline style
  を同時に持っている

影響:
- 仕様変更時に壊しやすい
- UI修正でも query ロジックに触れる
- 同種の集計ロジックが page 間で重複しやすい

推奨対応:
- `features/projects`, `features/progress`, `features/challenges` に責務分離
- page は `load data -> render sections` の薄い composition にする
- 集計系は `queries.ts` / `service.ts` へ移動

---

## lint で確認できた小さめの不整合

`npm run lint` 結果:

- `src/components/project/AnalyzingStatus.tsx`
  - `<a href="/projects/new">` で lint error
  - `next/link` に置換必要
- `src/app/(auth)/login/page.tsx`
  - `CardTitle` 未使用 warning

これは優先度は低いが、今後の整備時に一緒に直してよい。

---

## 構成改善の推奨方針

おすすめは全面リライトではなく、以下の順に「軸だけ作る」こと。

### Phase A: 信頼性修正

対象:
- progress 集計
- challenge grading
- explanation 再利用条件
- analyze enqueue 失敗補償

Done when:
- 指標が project ごとに正しく出る
- challenge 正誤判定の基準が一貫する
- enqueue 失敗で credits が消えっぱなしにならない

---

### Phase B: 定義の一元化

対象:
- plan / credit 上限
- action label
- grade label / icon
- difficulty 表示

候補:
- `src/lib/billing/config.ts`
- `src/lib/challenges/config.ts`
- `src/lib/ui/constants.ts`

Done when:
- `free/lite/team` などの定義が散らばらない
- 新プラン追加時に修正箇所が限定される

---

### Phase C: feature 単位へ整理

推奨構成案:

```txt
src/
  app/
  features/
    projects/
      queries.ts
      services.ts
      components/
    progress/
      queries.ts
      services.ts
      components/
    challenges/
      services.ts
      components/
  lib/
    billing/
    supabase/
    anthropic/
    inngest/
```

意図:
- `app/` は route composition に寄せる
- `features/` は画面・業務ロジックを持つ
- `lib/` は外部サービス接続や汎用 utilities に限定

---

### Phase D: view と style の整理

現状は inline style が非常に多い。
App Router + shadcn-ui を使っているため、今後は以下に寄せると保守しやすい。

- レイアウト: Tailwind utility
- 再利用 card / badge / stat row: UI component 化
- 色 / spacing / radius: CSS variable or token 化

特に dashboard / project detail / progress は見た目のパターンが似ているため、
card 系を共通化すると変更コストが大きく下がる。

---

## 次セッションで着手するならおすすめ順

1. `enrichProjectsWithProgress()` の distinct 集計修正
2. project detail の submissions query を project 限定に修正
3. challenge grading の full match 判定化
4. explanation 再利用条件の見直し
5. upload route の enqueue failure 補償
6. plan / credit config の一元化
7. `features/` 導入の最小リファクタ開始

---

## 補足メモ

- redoCebiv は「学習支援」プロダクトなので、見た目より先に評価ロジックの信頼性を固めるべき
- 特に progress / challenge 結果が信用できないと MVP 検証の学びも歪む
- 現時点では「作れている」が、「運用しながら伸ばせる構成」にはまだ達していない

---

## この handoff で意図していること

このメモは「今すぐ全部直す」ためではなく、
次の実装セッションで優先順位を迷わないようにするための handoff。

最初の改善テーマとしては
「指標の信頼性を直す」
を1本に絞るのが最も効果が高い。
