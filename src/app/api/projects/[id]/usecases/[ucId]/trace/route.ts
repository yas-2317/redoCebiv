import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateTrace } from '@/lib/traces/service'
import { enforceRateLimit, RATE_LIMITS, rateLimitExceededResponse } from '@/lib/security/rate-limit'
import { isUuid } from '@/lib/security/validation'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; ucId: string }> }
) {
  const { id: projectId, ucId } = await params
  if (!isUuid(projectId) || !isUuid(ucId)) {
    return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowed = await enforceRateLimit({
    supabase,
    actorKey: user.id,
    ...RATE_LIMITS.traceGenerate,
  })
  if (!allowed) {
    return rateLimitExceededResponse()
  }

  const result = await getOrCreateTrace({
    supabase,
    userId: user.id,
    projectId,
    usecaseId: ucId,
  })

  if (result.kind === 'error') {
    const statusByCode = {
      PROJECT_NOT_FOUND: 404,
      PROJECT_NOT_READY: 400,
      USECASE_NOT_FOUND: 404,
      FILES_NOT_FOUND: 404,
      INSUFFICIENT_CREDITS: 402,
      TRACE_GENERATION_FAILED: 500,
      TRACE_SAVE_FAILED: 500,
    } as const

    return NextResponse.json({ error: result.code }, { status: statusByCode[result.code] })
  }

  return NextResponse.json({
    usecase_id: ucId,
    name: result.usecaseName,
    ...result.trace,
    cached: result.cached,
  })
}
