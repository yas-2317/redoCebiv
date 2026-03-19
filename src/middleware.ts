import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストにマッチ:
     * - _next/static（静的ファイル）
     * - _next/image（画像最適化）
     * - favicon.ico
     * - public フォルダ内のファイル
     * - api/auth/callback（OAuthコールバック - セッション確立前なので除外）
     * - api/inngest（Inngest webhook - 独自署名検証を使うため除外）
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth/callback|api/inngest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
