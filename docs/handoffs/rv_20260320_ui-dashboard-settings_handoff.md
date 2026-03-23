# Handoff: ダッシュボード UI 調整 + Settings ページ新設

**日付**: 2026-03-20
**ブランチ**: main（未コミット）
**担当**: Claude Code（Sonnet 4.6）

---

## 完了した作業

### ダッシュボード（`src/app/(app)/page.tsx`）

| 変更内容 | 詳細 |
|---|---|
| 上段3カード card-header 追加 | Activity・What you've got back に青帯ヘッダー追加（Your footprint は既存） |
| グリッド統一 | 上段・下段を単一の `repeat(3, 1fr)` グリッドに統合。Your projects は `gridColumn: 'span 2'`。これで上段右（Your footprint）と下段右（Recent activity）の幅が一致 |
| カード高さ揃え | `alignItems: 'stretch'` に変更し、同行カードが同じ高さになった |
| Your footprint リスト化 | 2カラムグリッド → 縦リスト形式に変更。Projects（/projects リンク）・Features/Traces（インデント＋ツリー表示、リンクなし）・Challenges（/progress リンク）・Charts logged（/credits → /settings リンク、Map アイコン）|
| Charts logged | `credit_transactions` を集計して総消費数を表示。アイコンを `Zap` → `Map` に変更 |

### ヘッダー（`src/app/(app)/layout.tsx`）

- プラン名バッジ（例: `Wanderer`）を追加
- `N charts remaining` バッジを追加（残量20%未満で赤表示）
- `Upgrade` ボタン（→ /settings）を追加
- `getPlanInfo` を使った正しいプラン定義に統一（旧: `{ free: 100, pro: 500 }` → 修正済み）

### UserMenu（`src/components/ui/UserMenu.tsx`）

- ドロップダウンに Settings リンクを追加（Sign out の上）

### Settings ページ（新規: `src/app/(app)/settings/page.tsx`）

2カラムレイアウト:
- **左列**: Account（表示名・メール）+ Plan & Billing（プラン名・残量プログレスバー・Charts logged合計）
- **右列**: Usage history（直近50件のトランザクション履歴。日付・アクション名・プロジェクト名・消費数）

### その他

| ファイル | 変更内容 |
|---|---|
| `src/app/(app)/credits/page.tsx` | リダイレクト先 `/progress` → `/settings` に変更 |
| `src/app/globals.css` | `.footprint-row:hover` スタイルを追加 |

---

## 未完了・次にやること

### 【必須】コミット・プッシュ
このセッションの変更がすべて未コミット。まず push が必要。

```bash
git add src/app/(app)/page.tsx \
        src/app/(app)/layout.tsx \
        src/app/(app)/credits/page.tsx \
        src/app/(app)/settings/page.tsx \
        src/app/globals.css \
        src/components/ui/UserMenu.tsx
git commit -m "feat: ダッシュボードUI改善・Settingsページ新設"
git push
```

※ `src/app/(app)/progress/page.tsx` など他の変更ファイルは別セッション分なので、内容確認の上まとめてコミットするか分けるか判断すること。

### 【検討】Settings ページの拡張
- 表示名の編集機能（現状は表示のみ）
- Upgrade フロー（現状は "Upgrade coming soon" 表示のみ）

### 【検討】プラン名対応の全体確認
`wanderer` / `tracer` / `navigator` に変更済みだが、他ページ（progress など）に `free` / `pro` の残存がないか確認推奨。

---

## 技術メモ

- **グリッド統一の仕組み**: 上段3カードを `<>` フラグメントで包み、下段 Your projects に `gridColumn: 'span 2'`。単一グリッドなので列幅が完全一致する
- **プラン定義**: `src/lib/billing/config.ts` の `getPlanInfo()` が正解。`displayMax` が表示用上限（wanderer: 30、tracer: 80、navigator: 250）
- **Charts logged**: `credit_transactions.amount < 0` のレコードの `ABS(amount)` 合計
