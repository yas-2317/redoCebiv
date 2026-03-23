# redoCebiv SNS 戦略設計

最終更新: 2026-03-22
方針: @Redo_C_ebiV 単体アカウントで日英バイリンガル運用

---

## アカウント一覧

| プラットフォーム | アカウント | URL |
|---|---|---|
| X | @Redo_C_ebiV | https://x.com/Redo_C_ebiV |
| Zenn | redocebiv | https://zenn.dev/redocebiv |
| Dev.to | redo_c_ebiv | https://dev.to/redo_c_ebiv |
| ProductHunt | redocebiv | — |
| Reddit | redocebiv | — |

---

## 媒体マップ

| 媒体 | 地域 | 優先度 | 自動化 | 役割 |
|---|---|---|---|---|
| X | 海外・日本 | ★★★ | 高 | 認知・コミュニティ・β誘導 |
| ProductHunt | 海外 | ★★★ | 低（ローンチ1回） | β公開時の一気呵成 |
| Dev.to | 海外 | ★★ | 中 | SEO・英語圏エンジニアへの信頼構築 |
| Reddit | 海外 | ★★ | 低（手動投稿） | バイラル起点 |
| Zenn | 日本 | ★★ | 中 | 日本語圏SEO・権威確立 |
| note.com | 日本 | ★ | 低（月1本） | 長文・一人称ストーリー |

---

## X 戦略

### 言語比率

バイリンガル運用。英語メイン、日本語は週1〜2本。

### コンテンツ比率

| カテゴリ | 比率 | 例 |
|---|---|---|
| 共感（バイブコーダーの痛みに寄り添う） | 40% | 「動くけど何で動いてるかわからない」系 |
| Build in Public（開発過程の共有） | 25% | 実装日記・設計判断の公開 |
| Tips（純粋な価値提供） | 25% | React/Next.js読み方、ファイル探し方 |
| 哲学・ブランド構築 | 10% | Quiet Tools の思想、逆張りポジション |

### 曜日テーマ

| 曜日 | テーマ | 内容 |
|---|---|---|
| 月 | **Quiet Monday** | 今週「削ったもの」「シンプルにしたこと」の報告 |
| 水 | **Vibe Coder Wednesday** | バイブコーダー向けTips、ツール紹介（自社以外も） |
| 金 | **Build Friday** | redoCebiv開発の進捗、設計判断の共有 |

### ハッシュタグ

**常時使用**:
```
#VibeCoding  #バイブコーディング  #buildinpublic
```

**redoCebiv関連投稿時**:
```
#QuietTools  #redoCebiv
```

**文脈に応じて追加**:
```
#builtwithai  #AIでアプリ開発  #indiehacker  #ClaudeCode  #Cursor
```

**独自タグ（育成中）**:
```
#コードを取り戻す  #QuietMonday
```

### 投稿タイミング

| 言語 | 時間帯（JST） | 理由 |
|---|---|---|
| 日本語 | 平日 7:00〜8:00 / 12:00〜13:00 | 通勤・昼休みの閲覧ピーク |
| 英語 | 22:00〜24:00 | US西海岸の朝〜昼に重なる |

技術系投稿は火〜木が反応良い。

---

## X 自動化フロー

```
[Googleスプレッドシート B列にテーマ入力（週1回・日曜10分）]
         ↓
[Make Scheduler 毎朝 08:00 JST]
         ↓
[Google Sheets: 今日のテーマ取得]
         ↓
[Claude API (claude-haiku-4-5): EN/JP分岐で投稿案生成]
         ↓
[Google Sheets: C列に下書き / D列 = "draft"]
         ↓
[Buffer: Draftsに追加（09:00 JST スケジュール）]
         ↓
[あなた: 確認 → 承認 or 修正（5〜10分/日）]
         ↓
[Buffer: 自動投稿]
```

日本語ポストはB列テーマに「JP:」プレフィックスをつけて管理。

---

## Dev.to（英語ブログ）

投稿頻度: 月2本
自動化: Claude APIで英語初稿生成 → レビュー → 手動公開
X告知: Buffer自動投稿（記事公開日に同時）

| 記事 | ファイル | ステータス |
|---|---|---|
| Part 1: "I built a SaaS in a weekend" | `devto/01-built-saas-weekend.md` | 公開済み |
| Part 2: "What's actually inside an AI-generated app" | `devto/02-inside-ai-app.md` | 下書き |
| Part 3: "Why I stopped asking AI to fix" | `devto/03-stop-asking-to-fix.md` | 下書き |
| Part 4: "I tested every 'understand your code' tool" | `devto/04-tested-every-tool.md` | 構成完成 |

---

## Zenn（日本語ブログ）

投稿頻度: 月2本
X告知: 記事公開日に連動ポスト

| 記事 | ファイル | ステータス |
|---|---|---|
| 第1回: 「週末SaaSを作った。最初に壊れたこと」 | `zenn/01-weekend-saas.md` | 公開済み |
| 第2回: 「AIアプリの中を歩く」 | `zenn/02-inside-ai-app.md` | 下書き |
| 第3回: 「AIに直してと頼むのをやめたら」 | `zenn/03-stop-asking-to-fix.md` | 下書き |
| 第4回: 「AIでアプリを4つ出した。コードは1行も理解していなかった」 | `zenn/04-all-in-one-journey.md` | 構成完成 |

---

## Reddit（手動・バイラル狙い）

自動化なし。タイミングを見て手動投稿。

| サブレ | タイミング | 内容 |
|---|---|---|
| r/webdev | β前 | "I built a tool to understand AI-generated code" |
| r/ChatGPT | β前 | vibe codingの課題を語るスレッドへのコメント |
| r/reactjs | 記事公開時 | Dev.to記事の告知 |
| r/SideProject | β公開時 | ローンチ告知 |

ルール: 宣伝臭を出さない。「こういう問題を解決したくて作った」文脈で書く。

---

## ProductHunt（βローンチ時・一発勝負）

タイミング: βリリース当日
準備: リリース2〜4週前から

事前にやること:
- Upcoming Pageを作って事前登録者を集める
- Hunterを探す（フォロワーの多い人に依頼）
- ローンチ当日は朝（PST 00:01）に合わせる

ローンチページに必要なもの:
- 60秒以内のデモGIF or 動画
- キャッチコピー: "Understand your AI-generated code, feature by feature."
- タグライン: "You vibed coded it. Now understand it."

---

## note.com（日本語・長文ストーリー）

月1本ペースで投稿。X・Zennよりも深い一人称ストーリー向け。

テーマ案:
- 「AIでアプリを4つ出して学んだこと」
- 「コードを取り戻すという発想」
- 「Quiet Toolsを作っている理由」

---

## エンゲージメント戦略

### モニタリングキーワード（X検索）

**日本語**: 「バイブコーディング わからない」「バイブコーディング エラー」「AI コード 理解」「Cursor 迷子」「AIで作ったけど」

**英語**: "vibe coding nightmare" / "don't understand my code" / "vibe debugging" / "built with AI but" / "code archaeology"

### リプライの型

売り込みはしない。共感＋実用アドバイスを先に出す。信頼が先。

> （例）誰かが「AIで作ったアプリ、機能追加しようとしたらどこを触ればいいかわからない…」と投稿していたら：
>
> わかります。自分も全く同じ経験をしました。
> まず試してほしいのは、AIに「このプロジェクトの全ファイルの役割を一覧にして」と聞くこと。全体マップがあるだけで見え方が変わります。

（redoCebivの宣伝は一切しない。プロフィールを見に来てくれれば自然に伝わる）

### エンゲージ対象アカウント

**日本語圏**: イケハヤ、リツト、まさお（AI駆動開発研究部）、山浦清透、隣ITタカハシ

**英語圏**: Andrej Karpathy、Simon Willison、Justine Moore (a16z)、Pieter Levels

**コミュニティ**: Vibe Codingサロン（Discord・2,600人超）、Vibe Code Tokyo（リアルイベント）

---

## フェーズ設計

### Phase 0: 仕込み（今〜フォロワー300人）

- 英語共感ツイート中心。#buildinpublic で「作ってる」を発信
- マニフェストスレッドを固定ツイート化
- ProductHunt Upcoming Page 作成
- KPI: フォロワー300人（海外200+日本100）、マニフェスト5,000imp

### Phase 1: 信頼構築（フォロワー300〜1,000人）

- 週3〜5投稿（80%価値提供 / 20%自社）
- 曜日テーマ（月水金）本格稼働
- Dev.to / Zenn 記事月1本
- 戦略的リプライ日10件
- KPI: フォロワー1,000人、エンゲージメント率5%+

### Phase 2: コミュニティ参入（フォロワー1,000〜2,500人）

- Vibe Codingサロン / Vibe Code Tokyo へアプローチ
- デモGIF投稿開始
- β登録フォームをbioに追加
- KPI: フォロワー2,500人、ウェイトリスト200人

### Phase 3: ProductHuntローンチ（β準備完了後）

- ProductHuntローンチ当日に全媒体同時告知
- Redditへの手動投稿
- KPI: ProductHunt Top 5 of the day / ウェイトリスト500人

### Phase 4: スケール（ローンチ後）

- 英語圏拡大
- ユーザーの声をX・Dev.toで発信
- 「AIで作った→redoCebivで理解した」ストーリー連載
- KPI: フォロワー5,000人、ウェイトリスト1,000人

---

## あなたの作業量

| タスク | 時間 | 頻度 |
|---|---|---|
| Buffer Drafts確認・承認 | 5〜10分 | 毎日 |
| 翌週テーマ入力 | 10分 | 週1（日曜） |
| Dev.to / Zenn記事レビュー・公開 | 30分 | 隔週 |
| Reddit手動投稿 | 15分 | 月1〜2回 |
| **合計** | **約2.5時間/週** | |

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
| Dev.to | 英語記事 | 無料 |
| Zenn | 日本語記事 | 無料 |
| note.com | 日本語長文 | 無料 |
| ProductHunt | βローンチ | 無料 |
| Tally | β登録フォーム | 無料 |
| **合計** | | **$6/月（約¥900）** |

---

## 関連ファイル

| ファイル | 内容 |
|---|---|
| `ops/x-profile.md` | X bio・固定ツイート（マニフェストスレッド） |
| `ops/content-calendar.md` | スレッド・単発ポスト・投稿スケジュール |
| `ops/make-automation-guide.md` | Make フロー詳細 |
| `ops/claude-prompt.md` | API投稿生成プロンプト |
| `launch/producthunt-launch.md` | ProductHunt ローンチ準備 |
