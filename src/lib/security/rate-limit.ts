import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export const RATE_LIMITS = {
  projectUpload: {
    scope: 'project_upload',
    limit: 10,
    windowSeconds: 60 * 60,
  },
  traceGenerate: {
    scope: 'trace_generate',
    limit: 30,
    windowSeconds: 10 * 60,
  },
  changeProposal: {
    scope: 'change_proposal',
    limit: 15,
    windowSeconds: 10 * 60,
  },
  challengeSubmit: {
    scope: 'challenge_submit',
    limit: 60,
    windowSeconds: 10 * 60,
  },
} as const

export async function enforceRateLimit(params: {
  supabase: ServerSupabase
  actorKey: string
  scope: string
  limit: number
  windowSeconds: number
}) {
  const { supabase, actorKey, scope, limit, windowSeconds } = params

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_scope: scope,
    p_actor_key: actorKey,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })

  if (error) {
    throw new Error(`check_rate_limit error: ${error.message}`)
  }

  return data as boolean
}

export function rateLimitExceededResponse() {
  return NextResponse.json(
    { error: 'RATE_LIMITED' },
    {
      status: 429,
      headers: {
        'Retry-After': '60',
      },
    }
  )
}
