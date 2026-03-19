# redoCebiv ハンドオフ — 2026-03-19 Phase A 信頼性修正 / 課金設計 / バグ修正

作成日: 2026-03-19
ステータス: 完了
対象: 信頼性修正・課金設計・モデル最適化・バグ修正・リファクタリング・UI改善

---

## 概要

前回のレビューハンドオフ（rv_20260319_review_handoff.md）で特定された問題を中心に、
信頼性・コスト・コード品質・UXを横断的に改善した。

---

## 実施内容

### 1. Phase A — 信頼性修正

#### submissions query に project 絞り込みを追加
- `src/app/(app)/projects/[id]/page.tsx`
- `.eq('project_id', id)` を追加
- 他プロジェクトの提出履歴が solvedCount に混入するバグを修正

#### solvedCount を distinct 集計に変更
- `src/app/(app)/projects/page.tsx` の `enrichProjectsWithProgress()`
- `number` カウント → `Set<string>` に変更
- 同じ challenge を複数回提出しても1回としかカウントされない

#### challenge grading を全一致に変更
- `src/app/api/projects/[id]/challenges/[challengeId]/submit/route.ts`
- `.some()` → `.every()` で、全 correct_files を選ばないと正解にならない

#### explanation 再利用条件を厳格化
- 前回と `grade` が一致する場合のみ再利用
- 以前は grade に関わらず再利用していた

#### Inngest enqueue 失敗時の補償処理
- `src/app/api/projects/route.ts`
- try/catch でラップ、失敗時にクレジット返金 + project status='error'
- migration 007: `refund_credits` RPC を追加

#### inngest route の TypeScript エラー修正
- `isDev` オプションが廃止されていたため削除

---

### 2. コスト最適化・モデル変更

#### proposal.ts を Sonnet に変更
- `claude-haiku-4-5-20251001` → `claude-sonnet-4-6`
- 変更提案（proposal）はユーザーに直接見えるアウトプットのため品質優先

#### Prompt Caching 導入
- `src/lib/anthropic/trace.ts` / `src/lib/anthropic/proposal.ts`
- システムプロンプトと fileContext に `cache_control: { type: 'ephemeral' }` を追加
- 同一プロジェクトで連続して trace / proposal を実行する際のコスト大幅削減（推定70%超）

---

### 3. 課金設計の確定と実装

#### プラン名確定
- Wanderer（無料）/ Tracer（$5/月）/ Navigator（$12/月）
- 迷路メタファー：「迷子 → 追う → 自在に動ける」

#### クレジット設計確定
| アクション | 消費cr |
|---|---|
| analyze | 10cr |
| trace | 1cr |
| proposal | 1cr |
| grade | 無料 |

#### プラン詳細
| | Wanderer | Tracer | Navigator |
|---|---|---|---|
| 月額 | $0 | $5 | $12 |
| ウェルカム | 15cr | - | - |
| 月次補充 | 3cr（上限30cr） | 80cr | 250cr |
| トップアップ | ✗ | 100cr=$5 | 100cr=$5 |

#### billing/config.ts 作成
- `src/lib/billing/config.ts` — プラン定義・クレジット単価の単一ソース
- `getPlanInfo()` 関数でどこからでも参照可能
- `page.tsx` / `progress/page.tsx` の `PLAN_MAX` / `PLAN_LABEL` を統一

#### 未実装（課金運用確定後）
- DB の plan enum 変更（free/lite/team → wanderer/tracer/navigator）
- Stripe 連携・月次補充 Inngest cron
- 上記が決まり次第 migration 作成

---

### 4. バグ修正

#### trace クレジットリーク修正
- `src/app/api/projects/[id]/usecases/[ucId]/trace/route.ts`
- ファイル取得をクレジット消費前に移動
- ファイルが見つからない場合に消費済みクレジットが返ってこないバグを修正

#### Trace 重複挿入（レースコンディション）対応
- 同一 trace への同時リクエストで2重課金が起きる問題
- migration 008: `traces(usecase_id, project_zip_hash)` に UNIQUE 制約を追加
- 挿入失敗時（制約違反）: クレジット返金 + 既存 trace を返す

#### AnalyzingStatus 無限ローディング修正
- `src/components/project/AnalyzingStatus.tsx`
- fetch 失敗を無視していた（`if (!res.ok) return`）
- 連続失敗 5 回（15秒）でエラー表示、100 回（5分）でタイムアウト表示に変更

#### JSON 解析の堅牢化
- `src/lib/anthropic/utils.ts` 新規作成
- `extractJson<T>()` を共通化（直接 parse → regex fallback）
- エラーログを追加
- `analyze.ts` / `trace.ts` / `proposal.ts` を utils.ts に統一

---

### 5. リファクタリング

#### トークン上限を定数化
- `src/lib/anthropic/constants.ts` 新規作成
- `TOKEN_LIMITS.USECASE_EXTRACTION` / `TOKEN_LIMITS.CHALLENGE_GENERATION`
- `analyze-project.ts` のハードコード値を置き換え

#### enrichProjectsWithProgress の any 型除去
- `supabase: any` → `supabase: SupabaseClient` に変更
- eslint-disable コメントも削除

---

### 6. UI 改善

#### ChangeIntentForm
- loading 中に `<fieldset disabled>` でフォーム全体を無効化
- クレジット表示を `billing/config` から参照（-2 → -1 に修正）
- 候補 0 件時のフィードバックメッセージを追加

#### モバイル対応
- ダッシュボード stats グリッド: 固定3列 → `auto-fit minmax(200px, 1fr)`
- "What you've got back" グリッド: 固定3列 → `auto-fit minmax(100px, 1fr)`
- プロジェクト一覧: 固定2列 → `auto-fit minmax(280px, 1fr)`

---

## マイグレーション一覧（このセッションで追加）

| ファイル | 内容 | DB適用 |
|---|---|---|
| 007_refund_credits.sql | refund_credits RPC 追加 | ✅ 適用済み |
| 008_traces_unique.sql | traces に UNIQUE 制約 | ✅ 適用済み |

---

## 次セッションでやること候補

### 優先度高
- 課金運用の方針確定（Stripe、月次補充タイミング）
- DB plan enum 変更 migration（wanderer/tracer/navigator）

### 優先度中
- Challenge に「書き換え方」問題を追加（4択形式、Phase B）
- progress/page.tsx の Tailwind → inline style 統一（一貫性）
- ProjectCard hover を CSS で実装（キーボード対応）
- 3fr/2fr メインレイアウトのモバイル対応（Client Component化が必要）

### 優先度低
- Stripe 連携実装
- 月次補充 Inngest cron
- E2E テスト戦略

---

## コスト関連メモ

実測値（workos-test: 751KB, 235ファイル）:
- Sonnet での analyze: $0.62
- Haiku での analyze: $0.09
- Prompt Caching 後の trace 推定: $0.004/回

現在のモデル構成:
- analyze: Haiku（全ファイル送信のため Sonnet は非現実的）
- trace: Haiku + Caching
- proposal: Sonnet + Caching（品質優先）
- grade: Haiku
