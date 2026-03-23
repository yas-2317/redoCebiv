# Phase A Follow-up: legal pages + build fix handoff

## 概要

2026-03-24 時点で、法的ページ整備の実装と、`npm run build` を止めていた Supabase RPC 型エラーの解消まで完了。

今回の作業対象は以下の2系統:

1. legal pages / signup 同意導線の実装
2. `refund_credits` 呼び出しに起因する TypeScript ビルドエラーの修正

---

## 実装内容

### 1. legal pages

静的ページ側（`../quiet-tools-web/redoCebiv/`）に以下を反映:

- `tokusho.html` を新規作成
- `terms.html` に以下を反映
  - tokusho への nav リンク追加
  - 有料プラン節を「現在は無料プランのみ」に修正
  - サービス終了時の有償クレジット対応文言を追加
  - 免責条項を「故意・重過失を除く」形に修正
- `privacy.html` に以下を反映
  - tokusho への nav リンク追加
  - 個人情報の開示・訂正・削除・利用停止に関する節を追加
- `support.html` に tokusho への nav リンク追加

### 2. signup 同意導線

`src/app/(auth)/signup/page.tsx` に、Google / Email の両導線から視認できる位置で利用規約・プライバシーポリシーへの同意文言を追加。

配置は `CardContent` 末尾。

### 3. build fix

`refund_credits` RPC を service-role client から呼ぶ箇所で、Supabase の型推論が `args: undefined` 扱いになり、`npm run build` が TypeScript エラーで停止していた。

対処として:

- `src/lib/credits/refund.ts` を新規追加
- `refund_credits` 呼び出しを共通ヘルパーに集約
- 呼び出し側を以下の3箇所で共通化
  - `src/app/api/projects/route.ts`
  - `src/lib/traces/service.ts`
  - `src/lib/proposals/service.ts`

---

## 発生原因

### 症状

`npm run build` 実行時に以下の型エラーが発生していた。

- `src/app/api/projects/route.ts:21`
- `Argument of type '{ p_user_id: string; p_amount: number; p_project_id: string; }' is not assignable to parameter of type 'undefined'.`

### 原因

service-role 用に生成している Supabase client には、このリポジトリ内で DB schema / RPC の生成型が結び付いていない。

そのため `serviceClient.rpc('refund_credits', ...)` の呼び出しで、Supabase 側の generic 推論が壊れ、`refund_credits` の引数型を正しく解決できず `undefined` 扱いになっていた。

さらに同じ呼び出しパターンが複数ファイルに散っていたため、1 箇所だけの修正では別ファイルで再発する状態だった。

### 対処方針

RPC 呼び出しを `src/lib/credits/refund.ts` に集約し、`refund_credits` の引数 shape をそこで明示的に固定した。

これにより:

- RPC 呼び出しの型逃がしを1箇所に閉じ込められる
- `projects` / `traces` / `proposals` で同じ不整合が再発しにくい
- 将来 DB 型生成を入れる際も置き換え箇所が明確になる

---

## 変更ファイル

### アプリ本体

- `src/app/(auth)/signup/page.tsx`
- `src/app/api/projects/route.ts`
- `src/lib/credits/refund.ts`
- `src/lib/traces/service.ts`
- `src/lib/proposals/service.ts`

### 静的ページ

- `../quiet-tools-web/redoCebiv/tokusho.html`
- `../quiet-tools-web/redoCebiv/terms.html`
- `../quiet-tools-web/redoCebiv/privacy.html`
- `../quiet-tools-web/redoCebiv/support.html`

---

## 検証結果

### アプリ本体

実行コマンド:

```bash
npm run build
```

結果:

- 成功
- Next.js build 完了
- TypeScript 通過
- static page generation 完了

### 補足

build 中に以下の警告は継続して出るが、今回の修正とは別:

- workspace root の lockfile 警告
- `middleware` 命名の deprecation 警告

---

## 次の人向けメモ

- `quiet-tools-web` 側の変更はこのリポジトリ外なので、公開には `../quiet-tools-web` 側の commit / push が別途必要
- `refund_credits` と同種の RPC を追加する場合は、同様に共通ヘルパー経由に寄せる方が安全
- 将来的に Supabase の DB 型生成を導入するなら、`consume_credits` / `refund_credits` の helper を generated types ベースへ置き換えるとさらに安定する

---

## 未対応

- GitHub Pages 側の実公開確認は未実施
- `quiet-tools-web` 側の deploy / push は未実施
- handoff 以外のログ更新は未実施
