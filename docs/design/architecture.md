# redoCebiv — アーキテクチャ設計

最終更新: 2026-03-18

---

## 技術スタック全体像

```
[ブラウザ]
    │ HTTPS
    ▼
[Vercel] Next.js 15 App Router
    ├── Server Components（データ取得・初期描画）
    ├── Client Components（インタラクション・ストリーミング表示）
    ├── API Routes（/api/**）
    └── /api/inngest（Inngest webhook）
         │
         ├── [Supabase]
         │     ├── PostgreSQL（プロジェクト・成長データ）
         │     ├── Auth（メール・OAuth）
         │     └── Storage（ZIP一時保存）
         │
         ├── [Anthropic API]
         │     ├── claude-sonnet-4-6（解析・トレース・変更候補）
         │     └── claude-haiku-4-5（課題生成・採点）
         │
         └── [Inngest]
               └── analyze-project ジョブ（バックグラウンド処理）
```

---

## フォルダ構成

```
src/
├── app/
│   ├── (auth)/                          # 未認証ユーザー向け
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   │
│   ├── (app)/                           # 認証済みユーザー向け
│   │   ├── layout.tsx                   # 認証チェック・ナビゲーション
│   │   ├── page.tsx                     # ホーム（プロジェクト一覧）
│   │   ├── projects/
│   │   │   ├── new/
│   │   │   │   └── page.tsx             # ZIPアップロード
│   │   │   └── [id]/
│   │   │       ├── page.tsx             # プロジェクト詳細
│   │   │       ├── trace/
│   │   │       │   └── [ucId]/
│   │   │       │       └── page.tsx     # 機能トレース
│   │   │       ├── change/
│   │   │       │   └── page.tsx         # 変更候補
│   │   │       └── challenge/
│   │   │           └── [challengeId]/
│   │   │               └── page.tsx     # ミニ課題
│   │   └── growth/
│   │       └── page.tsx                 # 成長ダッシュボード
│   │
│   └── api/
│       ├── projects/
│       │   ├── route.ts                 # POST: プロジェクト作成・ZIPアップロード
│       │   └── [id]/
│       │       ├── route.ts             # GET: プロジェクト取得
│       │       ├── usecases/
│       │       │   ├── route.ts         # GET: ユースケース一覧
│       │       │   └── [ucId]/
│       │       │       └── trace/
│       │       │           └── route.ts # GET: トレース取得（キャッシュ付き）
│       │       ├── change-proposals/
│       │       │   └── route.ts         # POST: 変更候補生成
│       │       └── challenges/
│       │           ├── route.ts         # GET: 課題一覧
│       │           └── [challengeId]/
│       │               └── submit/
│       │                   └── route.ts # POST: 課題提出・採点
│       ├── growth/
│       │   └── route.ts                 # GET: 成長データ
│       └── inngest/
│           └── route.ts                 # Inngest webhook エンドポイント
│
├── components/
│   ├── ui/                              # shadcn/ui コンポーネント
│   ├── layout/
│   │   ├── Navigation.tsx               # サイドナビ・クレジット表示
│   │   └── CreditBadge.tsx
│   ├── project/
│   │   ├── ProjectCard.tsx
│   │   ├── ProjectUploadForm.tsx        # Client Component
│   │   ├── AnalyzingStatus.tsx          # ポーリング表示 Client Component
│   │   └── UsecaseList.tsx
│   ├── trace/
│   │   ├── TraceView.tsx
│   │   ├── FileTree.tsx                 # Client Component（選択操作）
│   │   ├── CodeViewer.tsx               # Client Component（ハイライト）
│   │   ├── FlowStepper.tsx
│   │   └── ExplanationStream.tsx        # Client Component（ストリーミング）
│   ├── change/
│   │   ├── ChangeIntentForm.tsx         # Client Component
│   │   └── ProposalCard.tsx
│   ├── challenge/
│   │   ├── ChallengeCard.tsx
│   │   ├── FileSelector.tsx             # Client Component
│   │   ├── AnswerForm.tsx               # Client Component
│   │   └── ResultView.tsx
│   └── growth/
│       ├── SkillMap.tsx
│       ├── SkillAxis.tsx
│       └── HistoryList.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                    # ブラウザ用クライアント
│   │   └── server.ts                    # サーバー用クライアント（cookies）
│   ├── anthropic/
│   │   ├── client.ts                    # Anthropic SDK初期化
│   │   ├── analyze.ts                   # 初期解析プロンプト
│   │   ├── trace.ts                     # トレース生成プロンプト
│   │   ├── proposal.ts                  # 変更候補生成プロンプト
│   │   ├── challenge.ts                 # 課題生成プロンプト
│   │   └── grade.ts                     # 採点・解説プロンプト
│   ├── inngest/
│   │   ├── client.ts                    # Inngest クライアント
│   │   └── functions/
│   │       └── analyze-project.ts       # メインジョブ
│   ├── credits/
│   │   └── index.ts                     # クレジット消費・付与ロジック
│   ├── zip/
│   │   └── index.ts                     # ZIP展開・フィルタリング
│   └── utils/
│       └── token.ts                     # トークン数見積もり
│
└── types/
    └── index.ts                         # 共通型定義
```

---

## Server / Client Component の境界

### 原則
- **デフォルトは Server Component**（データ取得・初期描画）
- **Client Component は最小限**（インタラクション・ストリーミング・ブラウザAPI）

### 境界の具体例

| コンポーネント | SC/CC | 理由 |
|---|---|---|
| `app/(app)/page.tsx` | SC | プロジェクト一覧をSEで取得 |
| `ProjectCard.tsx` | SC | 静的表示 |
| `ProjectUploadForm.tsx` | **CC** | ファイル選択・アップロード操作 |
| `AnalyzingStatus.tsx` | **CC** | ポーリング（`useEffect`）|
| `TraceView.tsx` | SC | 初期データ取得 |
| `ExplanationStream.tsx` | **CC** | ストリーミングテキスト表示 |
| `FileTree.tsx` | **CC** | ファイル選択操作 |
| `CodeViewer.tsx` | **CC** | コードハイライト（ライブラリ依存）|
| `ChangeIntentForm.tsx` | **CC** | テキスト入力・送信 |
| `SkillMap.tsx` | SC | 静的な成長データ表示 |

---

## API Routes の責務

各 API Route はシンプルに保つ。ロジックは `lib/` に切り出す。

```typescript
// 例: POST /api/projects/[id]/usecases/[ucId]/trace
export async function GET(req: Request, { params }: { params: { id: string; ucId: string } }) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 1. プロジェクトの所有権確認（RLSで代替可）
  // 2. キャッシュ確認
  const cached = await getTraceFromCache(params.ucId, project.zip_hash)
  if (cached) return NextResponse.json(cached)

  // 3. クレジット消費
  const ok = await consumeCredits(user.id, 1, 'trace_generate', params.id)
  if (!ok) return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 402 })

  // 4. ストリーミングレスポンス
  return generateTraceStream(params.ucId, files)
}
```

---

## 状態管理方針

グローバル状態管理ライブラリ（Zustand等）は使わない。

| データ種別 | 管理方法 |
|---|---|
| サーバーデータ（プロジェクト・成長記録） | Server Componentで取得 → props経由 |
| フォーム状態 | `useState` / `useReducer` |
| ストリーミングテキスト | `useState` + `ReadableStream` |
| クレジット残高 | Server Componentで取得、操作後に`router.refresh()` |

---

## ポーリング設計（解析待ち）

ZIPアップロード後、解析完了までクライアントがポーリングする。

```typescript
// AnalyzingStatus.tsx (Client Component)
useEffect(() => {
  const interval = setInterval(async () => {
    const res = await fetch(`/api/projects/${projectId}`)
    const project = await res.json()
    if (project.status === 'ready') {
      clearInterval(interval)
      router.push(`/projects/${projectId}`)
    }
    if (project.status === 'error') {
      clearInterval(interval)
      setError(project.error_message)
    }
  }, 3000)  // 3秒間隔
  return () => clearInterval(interval)
}, [projectId])
```

---

## ストリーミング実装

```typescript
// lib/anthropic/trace.ts
export async function generateTraceStream(ucId: string, files: ProjectFile[]) {
  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildTracePrompt(ucId, files) }]
  })

  // Next.js StreamingResponse
  return new Response(
    new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta') {
            controller.enqueue(new TextEncoder().encode(chunk.delta.text))
          }
        }
        controller.close()
      }
    }),
    { headers: { 'Content-Type': 'text/event-stream' } }
  )
}
```

---

## 環境変数

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # サーバーサイドのみ

# Anthropic
ANTHROPIC_API_KEY=

# Inngest
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# App
NEXT_PUBLIC_APP_URL=            # https://redocebiv.app
```

---

## Supabase Storage 設定

| 項目 | 値 |
|---|---|
| バケット名 | `project-zips`（非公開） |
| ファイルサイズ上限 | 20MB |
| 許可する拡張子 | `.zip` のみ |
| パス構造 | `{user_id}/{project_id}/source.zip` |
| 保持期間 | 解析完了後に即削除（`zip_storage_path = NULL`） |

**UI上の案内文**: 「node_modulesを除いてZIP化してください（例: `zip -r app.zip . --exclude 'node_modules/*'`）」

---

## デプロイ構成

| 環境 | サービス | 設定 |
|---|---|---|
| 本番 | Vercel（Hobby → Pro） | main ブランチ自動デプロイ |
| ステージング | Vercel Preview | PR ごとに自動生成 |
| DB | Supabase（Free → Pro） | 本番・ステージング共有（将来分離） |
| バックグラウンド | Inngest Cloud | 本番・ステージング別プロジェクト |
