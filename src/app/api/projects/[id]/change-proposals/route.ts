import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProposal } from '@/lib/proposals/service'
import { enforceRateLimit, RATE_LIMITS, rateLimitExceededResponse } from '@/lib/security/rate-limit'
import { isUuid, validateChangeProposalInput } from '@/lib/security/validation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  if (!isUuid(projectId)) {
    return NextResponse.json({ error: 'INVALID_PROJECT_ID' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowed = await enforceRateLimit({
    supabase,
    actorKey: user.id,
    ...RATE_LIMITS.changeProposal,
  })
  if (!allowed) {
    return rateLimitExceededResponse()
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = validateChangeProposalInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const result = await createProposal({
    supabase,
    userId: user.id,
    projectId,
    intent: parsed.value.intent,
  })

  if (result.kind === 'error') {
    const statusByCode = {
      PROJECT_NOT_FOUND: 404,
      FILES_NOT_FOUND: 404,
      INSUFFICIENT_CREDITS: 402,
      PROPOSAL_GENERATION_FAILED: 500,
      PROPOSAL_SAVE_FAILED: 500,
    } as const

    return NextResponse.json({ error: result.code }, { status: statusByCode[result.code] })
  }

  return NextResponse.json({
    id: result.proposalId,
    intent: result.intent,
    ...result.proposal,
  })
}
