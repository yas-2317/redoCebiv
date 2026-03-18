# redoCebiv — AI設計

最終更新: 2026-03-18

---

## 全体パイプライン概要

```
[ユーザー]
    │
    ├── ZIPアップロード
    │       │
    │       ▼
    │   [API Route] → Supabase Storage に保存
    │       │         Inngest ジョブをトリガー
    │       │         202 を返却（ポーリング開始）
    │       │
    │       ▼
    │   [Inngest Job: analyze-project]
    │       ├── ZIP展開・フィルタリング
    │       ├── Claude Sonnet: ユースケース抽出
    │       ├── Claude Haiku: 課題セット生成
    │       ├── DB更新（usecases / challenges）
    │       └── project.status = 'ready'
    │
    ├── トレースを見る（初回）
    │       │
    │       ▼
    │   [API Route]
    │       ├── traces テーブルを (usecase_id, zip_hash) で検索
    │       ├── キャッシュミス → Claude Sonnet でトレース生成 → DB保存
    │       └── キャッシュヒット → DBから返す（クレジット消費なし）
    │
    ├── 変更候補を調べる
    │       │
    │       ▼
    │   [API Route]
    │       └── Claude Sonnet でリアルタイム生成（キャッシュなし）
    │
    └── 課題提出・採点
            │
            ▼
        [API Route]
            └── Claude Haiku で採点・解説生成
```

---

## 1. 初期解析パイプライン（Inngest）

### ジョブ: `analyze-project`

**トリガー**: `POST /api/projects` の完了後

**処理ステップ**:

```
Step 1: ZIP展開・フィルタリング
  - Supabase StorageからZIPをダウンロード
  - 展開してファイルツリーを構築
  - 除外: node_modules / .git / dist / .next / *.lock / *.map / バイナリ
  - 残ったファイルをproject_filesに保存

Step 2: ファイル選定（AIに渡すもの）
  - 優先: src/**/*.tsx, src/**/*.ts, app/**/*.tsx, app/**/*.ts
  - 次点: *.config.ts, tailwind.config.ts
  - 除外: *.test.ts, *.spec.ts, *.d.ts
  - 合計トークン数を見積もり（100文字 ≈ 25トークン）

Step 3: Claude Sonnet でユースケース抽出
  - 全ファイルを1プロンプトに詰める（200kウィンドウ活用）
  - 大規模プロジェクト（>150k tokens）の場合はStep 4へ

Step 4（大規模のみ）: 分割処理
  - Pass 1: ファイルツリーだけ渡してユースケース名候補を抽出
  - Pass 2: 各ユースケースに関連しそうなファイルだけを渡して詳細抽出

Step 5: Claude Haiku で初期課題セット生成
  - 抽出したユースケースをもとに difficulty 1〜2 の課題を8件生成

Step 6: DB更新
  - usecases テーブルに INSERT
  - challenges テーブルに INSERT
  - project.status = 'ready' に更新
  - zip_storage_path を NULL に（Storageから削除）
```

---

## 2. ユースケース抽出プロンプト

**モデル**: claude-sonnet-4-6
**コンテキスト**: 全ファイル内容

```
システムプロンプト:
あなたはNext.js / Reactアプリのコードを分析するエキスパートです。
以下のコードベースを読み、ユーザーが「やりたいこと」という視点で
ユースケースを抽出してください。

ルール:
- ユースケースはユーザーの行動目標（「〇〇する」形式）で表現する
- UIイベント起点のもののみ（内部処理だけのものは除く）
- 重複は避ける
- 6〜12件を目安に抽出する

出力形式（JSON）:
{
  "usecases": [
    {
      "name": "タスクを追加する",
      "description": "ユーザーがテキストを入力してAddボタンを押すとタスクが追加される",
      "related_file_paths": ["components/AddTaskForm.tsx", "hooks/useTaskForm.ts", "store/taskStore.ts"]
    }
  ]
}

---
コードベース:
[ファイルパス]: [内容]
...
```

---

## 3. 機能トレース生成

**モデル**: claude-sonnet-4-6
**ストリーミング**: あり（explanationをストリーミング表示）

**キャッシュ確認フロー**:
```typescript
const cached = await db.traces.findFirst({
  where: { usecase_id: ucId, project_zip_hash: project.zip_hash }
})
if (cached) return cached  // クレジット消費なし
```

**プロンプト**:
```
システムプロンプト:
あなたはNext.js / Reactアプリのコードを分析し、
プログラミング初心者にやさしく説明するエキスパートです。

ユースケース「{usecase.name}」に関連するコードを分析して、
以下を返してください：

1. 関連ファイルと各ファイルの役割
2. 処理フロー（入力 → 分岐 → 状態更新 → 表示更新）
3. 日本語のやさしい説明（プログラミング初心者向け）

出力形式（JSON）:
{
  "related_files": [
    {"path": "...", "role": "...", "keyLines": [18, 24]}
  ],
  "flow": [
    {"step": 1, "label": "入力", "description": "...", "file": "...", "line": 18}
  ],
  "explanation": "..."
}

---
ユースケース: {usecase.name}
説明: {usecase.description}

関連ファイル:
[ファイルパス]: [内容]
...
```

---

## 4. 変更候補提示

**モデル**: claude-sonnet-4-6
**ストリーミング**: あり

**プロンプト**:
```
システムプロンプト:
あなたはNext.js / Reactアプリの変更を案内するエキスパートです。

ユーザーの変更意図に対して、どのファイルのどこを変えればよいかを
初心者にわかりやすく説明してください。

出力形式（JSON）:
{
  "change_type": "validation",
  "difficulty": 2,
  "candidates": [
    {
      "file": "components/AddTaskForm.tsx",
      "line": 18,
      "code_snippet": "disabled={text.trim() === ''}",
      "reason": "...",
      "change_type_label": "バリデーション追加"
    }
  ]
}

---
変更意図: {intent}

コードベース（主要ファイル）:
[ファイルパス]: [内容]
...
```

---

## 5. 課題生成

**モデル**: claude-haiku-4-5
**タイミング**: 初期解析時にまとめて生成（キャッシュ）

**プロンプト**:
```
このNext.js / Reactアプリに対して、プログラミング初心者向けの
ミニ改造課題を8件生成してください。

難易度分布:
- difficulty 1（文言変更・表示変更）: 3件
- difficulty 2（条件追加・バリデーション）: 4件
- difficulty 3（複数箇所の変更）: 1件

出力形式（JSON）:
{
  "challenges": [
    {
      "title": "追加ボタンを無効化する",
      "description": "未入力のまま追加ボタンを押せないようにしてください",
      "type": "validation",
      "difficulty": 2,
      "answer": {
        "correct_files": ["components/AddTaskForm.tsx"],
        "correct_code": "disabled={text.trim() === ''}",
        "explanation": "...",
        "change_type": "バリデーション追加",
        "related_examples": []
      },
      "hint": "ボタンコンポーネントのpropsを確認してみてください"
    }
  ]
}

---
ユースケース一覧:
{usecases}

コードベース（主要ファイル）:
{files}
```

---

## 6. 課題採点・解説

**モデル**: claude-haiku-4-5
**ストリーミング**: なし（採点結果が揃ってから表示）

**採点ロジック（ルールベース優先）**:
```typescript
// ファイル選択の正誤はルールベースで判定（AI不要）
const fileMatch = submission.selected_files.some(
  f => challenge.answer.correct_files.includes(f)
)

// gradeを算出
const grade = fileMatch
  ? (submission.used_hint ? 'with_hint' : 'self')
  : 'missed'
```

**解説生成プロンプト**（Haiku、短文生成）:
```
課題「{challenge.title}」の解説を生成してください。

ユーザーの回答: {submission.answer_text}
正解: {challenge.answer.correct_code}
判定: {grade}

以下を含む解説を200文字以内で生成してください:
- なぜそこを変えるのか
- {grade === 'missed' ? 'ヒント: どこを見ればよかったか' : '良かった点'}
- 同種の変更パターンの説明
```

---

## 7. コンテキストウィンドウ管理

### 通常ケース（プロジェクト全体 ≤ 150k tokens）
→ 全ファイルを1プロンプトに詰めて処理。シンプル。

### 大規模ケース（> 150k tokens）の分割戦略
```
Pass 1（全体俯瞰）:
  - ファイルツリー（パス一覧のみ）を渡す
  - ユースケース名の候補リストを生成

Pass 2（ユースケースごと）:
  - 各ユースケースに関連しそうなファイルだけを抽出
  - 1ユースケースあたり最大10ファイル程度
  - 詳細なトレースを生成
```

### トークン数の見積もり
```typescript
function estimateTokens(content: string): number {
  // 日本語: 1文字 ≈ 1.5トークン
  // 英語コード: 1文字 ≈ 0.25トークン
  // 安全側で: 1文字 ≈ 0.5トークン（コードメイン）
  return Math.ceil(content.length * 0.5)
}
```

---

## 8. エラーハンドリング

| エラー種別 | 対応 |
|---|---|
| Claude API タイムアウト | Inngest の自動リトライ（3回まで） |
| レート制限（429） | Inngest の指数バックオフリトライ |
| JSON パースエラー | 再プロンプト（"JSON形式で返してください"を追加）1回まで |
| コンテキスト超過 | 大規模ケースの分割処理にフォールバック |
| 解析結果が空 | project.status = 'error'、ユーザーに再試行を促す |

---

## 9. コスト管理

APIリクエスト前に必ずクレジット確認を行う。

```typescript
async function withCreditCheck(
  userId: string,
  actionType: string,
  creditCost: number,
  fn: () => Promise<unknown>
) {
  const ok = await consumeCredits(userId, creditCost, actionType)
  if (!ok) throw new InsufficientCreditsError()
  return fn()
}
```

**全体キャップ確認**（フリーユーザーのみ）:
```typescript
// フリーティア全体の月間AIコスト上限$300を超えていないか確認
// 超過時はキュー待ち（実装は将来フェーズ）
```
