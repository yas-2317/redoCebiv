import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type AdminGuardResult =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; userId: string }
  | { ok: false; response: NextResponse }

export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const isAdmin =
    user.app_metadata?.role === 'admin' ||
    user.app_metadata?.is_admin === true

  if (!isAdmin) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return { ok: true, supabase, userId: user.id }
}
