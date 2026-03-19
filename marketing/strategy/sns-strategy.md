# redoCebiv SNS 戦略設計

最終更新: 2026-03-18
方針変更: 海外メイン・日本サブ（英語対応MVP並行）

---

## 媒体マップ

| 媒体 | 地域 | 優先度 | 自動化 | 役割 |
|---|---|---|---|---|
| X | 海外・日本 | ★★★ | 高 | 認知・コミュニティ・β誘導 |
| ProductHunt | 海外 | ★★★ | 低（ローンチ1回） | β公開時の一気呵成 |
| dev.to | 海外 | ★★ | 中 | SEO・英語圏エンジニアへの信頼構築 |
| Reddit | 海外 | ★★ | 低（手動投稿） | バイラル起点 |
| Zenn | 日本 | ★ | 中 | 日本語圏SEO |

---

## 各媒体の設計

### X（最重要）

**言語**: 英語メイン / 日本語は週1〜2本

**コンテンツ構成**:
- 共感ツイート: 70%（"You vibed coded an app. Now you can't touch it."）
- 教育Tip: 20%（React code reading tips, vibe coding patterns）
- プロダクト: 10%（デモ・機能紹介）

**ハッシュタグ**:
```
#vibecoding  #buildinpublic  #indiedev  #webdev  #React  #Cursor
```

**日本語ポスト（週1〜2本）**:
```
#バイブコーディング  #個人開発  #Cursor  #AIコーディング
```

**自動化**: Make + Buffer + Claude API（既存フロー、英語プロンプトに更新）

---

### ProductHunt（β公開時・一発勝負）

**タイミング**: βリリース当日
**準備期間**: リリース2〜4週前から準備

事前にやること:
- ProductHuntアカウント作成（redocebiv@gmail.com）
- Hunterを探す（フォロワーの多い人に依頼）
- Upcoming Pageを作って事前登録者を集める
- ローンチ当日は朝（PST 00:01）に合わせる

ローンチページに必要なもの:
- 60秒以内のデモGIF or 動画（画面収録 + Loom等でOK）
- キャッチコピー: "Understand your AI-generated code, feature by feature."
- タグライン: "You vibed coded it. Now understand it."

---

### dev.to（英語ブログ）

**Zennの代わりに海外向けはdev.toを使う**（Zennは日本語記事専用で継続）

| 項目 | 設定 |
|---|---|
| 投稿頻度 | 月2本（Zennと同じ頻度、英訳 or 別内容） |
| 自動化 | Claude APIで英語初稿生成 → レビュー → 手動公開 |
| X告知 | Buffer自動投稿 |

記事テーマ案:
- "How to read AI-generated React code you didn't write"
- "The vibe coding wall: what happens after you ship"
- "5 patterns that explain 80% of Next.js vibe code"

---

### Reddit（手動・バイラル狙い）

自動化なし。タイミングを見て手動投稿。

| サブレ | 投稿タイミング | 内容 |
|---|---|---|
| r/webdev | β前 | "I built a tool to understand AI-generated code" |
| r/ChatGPT | β前 | vibe codingの課題を語るスレッドへのコメント |
| r/reactjs | 記事公開時 | dev.to記事の告知 |
| r/SideProject | β公開時 | ローンチ告知 |

ルール: 宣伝臭を出さない。「こういう問題を解決したくて作った」文脈で書く。

---

## X 自動化フロー（英語版）

```
[Googleスプレッドシート B列にテーマ入力（週1回・日曜10分）]
         ↓
[Make Scheduler 毎朝 08:00 JST]
         ↓
[Google Sheets: 今日のテーマ取得]
         ↓
[Claude API (claude-haiku-4-5): 英語投稿案生成]
         ↓
[Google Sheets: C列に下書き / D列 = "draft"]
         ↓
[Buffer: Draftsに追加（09:00 JST スケジュール）]
         ↓
[あなた: 確認 → 承認 or 修正（5〜10分/日）]
         ↓
[Buffer: 自動投稿]
```

日本語ポストは週1〜2本、スプレッドシートのテーマに「JP:」プレフィックスをつけて管理。ClaudeプロンプトでJP/EN分岐。

---

## フェーズ設計

### Phase 0: 仕込み（今〜フォロワー200人）

- 英語共感ツイート中心。#buildinpublic で「作ってる」を発信
- ProductHunt Upcoming Page 作成（早めに）
- CTA: フォローのみ
- KPI: フォロワー200人（海外100+日本100）

### Phase 1: β告知（フォロワー200人〜）

- デモGIF投稿開始（画面収録でOK）
- β登録フォームをbioに追加
- ProductHunt Upcoming Page → β登録誘導
- KPI: β登録100人

### Phase 2: ProductHuntローンチ（β準備完了後）

- ProductHuntローンチ当日に全媒体同時告知
- Redditへの手動投稿
- KPI: ProductHunt Top 5 of the day / β登録500人

### Phase 3: β中

- ユーザーの声をX・dev.toで発信
- KPI: 有料転換率・月次継続率

---

## アカウント設計

### X

| 項目 | 設定値 |
|---|---|
| ユーザー名 | @redocebiv |
| 表示名 | redoCebiv |
| Bio（英語） | Understand your AI-generated code, feature by feature. Built for vibe coders. β coming soon → [URL] |
| 固定ツイート | 英語版ローンチ予告 or ProductHunt Upcoming |

### dev.to / Zenn / ProductHunt / Reddit

全て `redocebiv` で統一。メールは `redocebiv@gmail.com`。

---

## ツール・費用

| ツール | 用途 | 費用 |
|---|---|---|
| Gmail (redocebiv@gmail.com) | 全アカウント管理 | 無料 |
| X | メイン投稿 | 無料 |
| Buffer (Essentials) | スケジュール管理 | $6/月 |
| Make (Free) | 自動化フロー | 無料 |
| Google Sheets | 投稿・テーマ管理 | 無料 |
| Claude API (Haiku) | 投稿文生成 | ~¥3/月 |
| dev.to | 英語記事 | 無料 |
| Zenn | 日本語記事 | 無料 |
| ProductHunt | βローンチ | 無料 |
| Tally | β登録フォーム | 無料 |
| **合計** | | **$6/月（約¥900）** |

---

## あなたの作業量

| タスク | 時間 | 頻度 |
|---|---|---|
| Buffer Drafts確認・承認 | 5〜10分 | 毎日 |
| 翌週テーマ入力 | 10分 | 週1（日曜） |
| dev.to / Zenn記事レビュー・公開 | 30分 | 隔週 |
| Reddit手動投稿 | 15分 | 月1〜2回 |
| **合計** | **約2.5時間/週** | |

---

## プロダクト英語対応との連動

SNSを英語メインにするには、プロダクト側で以下が必要:

| 対応 | 優先度 | 備考 |
|---|---|---|
| UI言語切り替え（EN/JP） | 必須 | β前に対応 |
| AIレスポンスの英語出力 | 必須 | プロンプトに言語指示を追加 |
| LP（英語版） | 必須 | β登録フォームの英語対応 |
| エラーメッセージの英語化 | 必須 | |
| Zenn記事の英語版 → dev.to | 推奨 | 初稿はClaudeが翻訳 |

→ 実装タスクとして別途イシューを立てる

---

## 関連ファイル

| ファイル | 内容 |
|---|---|
| `x-profile.md` | X bio・固定ツイート（→英語版に更新要） |
| `content-calendar.md` | Week 1〜4 投稿文（→英語版に更新要） |
| `make-automation-guide.md` | Make フロー詳細 |
| `claude-prompt.md` | API投稿生成プロンプト（→英語プロンプトに更新要） |
| `zenn-article-1.md` | 日本語Zenn記事初稿 |
