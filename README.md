# redoCebiv

AI 生成コードを機能起点で読み解き、軽微な変更を自力で進められる状態へ導く Next.js アプリです。

## Development

```bash
npm run dev
```

## Top-Level Structure

- `src/`: アプリ本体
- `public/`: 配信する静的アセット
- `supabase/`: マイグレーションと DB 関連
- `docs/`: 設計、ハンドオフ、マーケティング資料
- `assets/branding/`: 作業用ブランド素材

## Root Files That Stay At Top Level

以下はツールやフレームワークの都合でルート配置を維持する。

- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `next-env.d.ts`
- `components.json`
- `.env.local`
- `.env.local.example`
