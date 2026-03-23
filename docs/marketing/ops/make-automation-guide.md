# Make 自動化フロー 設定手順

## 概要

毎朝Claude APIが投稿案を生成し、Googleスプレッドシートに書き込み、Bufferにスケジュール登録するまでを自動化する。

```
[Make Scheduler] → [Claude API] → [Google Sheets] → [Buffer]
```

---

## 前提

- Make アカウント（無料プランでOK）
- Claude API キー（console.anthropic.com で取得）
- Google アカウント（スプレッドシート用）
- Buffer アカウント（X連携済み）

---

## Step 1: Google スプレッドシートの準備

### シート構成

シート名: `posts`

| A列 | B列 | C列 | D列 | E列 | F列 |
|---|---|---|---|---|---|
| date | theme | draft | status | scheduled_at | posted_at |

- `status` の値: `draft` / `approved` / `posted` / `skip`
- B列の `theme` は手動で入れる週次テーマ（例: `共感ツイート`）

### 初期データ（Week 1分）

B列に以下を埋めておく:

```
Day 1: 共感ツイート（Cursor + 30分溶けた）
Day 2: 共感ツイート（なぜ動くか分からない）
Day 3: 問題提起（vibecoding の壁3つ）
Day 4: 共感ツイート（ボタンのテキスト）
Day 5: ソリューション予告
Day 6: 共感ツイート（1行も直せない）
Day 7: 週振り返り + β登録案内
```

---

## Step 2: Make シナリオの作成

### シナリオ1: 投稿案生成（毎朝 08:00）

#### モジュール構成

```
1. Scheduler（毎日 08:00）
2. Google Sheets - Search Rows（今日のthemeを取得）
3. Claude API - HTTP Request（投稿案を生成）
4. Google Sheets - Update Row（draft列に書き込み）
5. Buffer - Create Post（下書きとして追加）
```

#### モジュール1: Scheduler

- Type: `Scheduled`
- Interval: `1 day`
- Time: `08:00`（あなたのタイムゾーン）

#### モジュール2: Google Sheets - Search Rows

- Spreadsheet ID: [あなたのスプレッドシートID]
- Sheet Name: `posts`
- Filter:
  - Column: A（date）
  - Condition: `equals`
  - Value: `{{formatDate(now; "YYYY-MM-DD")}}`
- Limit: 1

#### モジュール3: HTTP Request（Claude API）

- URL: `https://api.anthropic.com/v1/messages`
- Method: `POST`
- Headers:
  ```
  x-api-key: [あなたのAPIキー]
  anthropic-version: 2023-06-01
  content-type: application/json
  ```
- Body（JSON）:
  ```json
  {
    "model": "claude-opus-4-6",
    "max_tokens": 500,
    "messages": [
      {
        "role": "user",
        "content": "{{2.theme}}"
      }
    ],
    "system": "[system-promptファイルの内容をここに貼る]"
  }
  ```
  ※ system promptは `/docs/marketing/ops/claude-prompt.md` を参照

#### モジュール4: Google Sheets - Update Row

- Row Number: `{{2.rowNumber}}`
- C列（draft）: `{{3.content[0].text}}`
- D列（status）: `draft`

#### モジュール5: Buffer - Create Post

- Profile: [X アカウントを選択]
- Content: `{{3.content[0].text}}`
- Scheduled at: `{{addHours(now; 1)}}` （翌時間に仮スケジュール）
- Status: `draft`（Buffer上で下書きとして保存）

---

### シナリオ2: 承認済み投稿の自動化（オプション）

Googleスプレッドシートで status を `approved` に変えたら自動投稿するフロー。

```
1. Scheduler（30分おき）
2. Google Sheets - Search Rows（status = approved を検索）
3. Buffer - Update Post（scheduled_at を確定）
4. Google Sheets - Update Row（status = scheduled に更新）
```

---

## Step 3: Buffer の設定

1. Buffer にログイン
2. `Connect Channels` → X（Twitter）を連携
3. `Queue` の投稿時間を設定（例: 09:00 / 19:00）
4. Makeから追加された下書きは `Drafts` タブで確認・編集できる

---

## 運用フロー（毎日）

```
08:00  Make が自動で投稿案を生成・Bufferに下書き追加
  ↓
08:30  あなたがBufferのDraftsを確認
  ↓
      OK → 承認（そのまま投稿キューに移動）
      修正あり → 文面を直して承認
      今日はスキップ → Deleteまたはスケジュール変更
  ↓
09:00  Buffer が自動投稿
```

---

## トラブルシューティング

| 症状 | 原因 | 対処 |
|---|---|---|
| Claudeが生成しない | APIキーの期限切れ or クレジット不足 | console.anthropic.com で確認 |
| Googleスプレッドシートに書き込めない | 権限エラー | Make のGoogle Sheets接続を再認証 |
| Bufferに追加されない | Buffer API の接続切れ | Buffer の OAuth を再接続 |
| 投稿が重複する | Schedulerが二重起動 | Make の実行履歴を確認し、シナリオをOFF→ONに |
