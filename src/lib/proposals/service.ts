import { generateProposal, type GeneratedProposal } from '@/lib/anthropic/proposal'
import { CREDIT_COSTS } from '@/lib/billing/config'
import { consumeCredits } from '@/lib/credits'
import { createRefundClient, refundCredits as refundCreditsRpc } from '@/lib/credits/refund'
import { createClient } from '@/lib/supabase/server'
import { buildFileContext, selectFilesForAnalysis } from '@/lib/zip'

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

type ProposalErrorCode =
  | 'PROJECT_NOT_FOUND'
  | 'FILES_NOT_FOUND'
  | 'INSUFFICIENT_CREDITS'
  | 'PROPOSAL_GENERATION_FAILED'
  | 'PROPOSAL_SAVE_FAILED'

type ProposalServiceResult =
  | {
      kind: 'ok'
      proposalId: string | null
      intent: string
      proposal: GeneratedProposal
    }
  | {
      kind: 'error'
      code: ProposalErrorCode
    }

async function refundCredits(userId: string, projectId: string, amount: number) {
  const serviceClient = createRefundClient()
  await refundCreditsRpc(serviceClient, {
    userId,
    amount,
    projectId,
  })
}

export async function createProposal(params: {
  supabase: ServerSupabase
  userId: string
  projectId: string
  intent: string
}): Promise<ProposalServiceResult> {
  const { supabase, userId, projectId, intent } = params

  const { data: project } = await supabase
    .from('projects')
    .select('id, status, stack')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (!project || project.status !== 'ready') {
    return { kind: 'error', code: 'PROJECT_NOT_FOUND' }
  }

  const { data: files } = await supabase
    .from('project_files')
    .select('path, content, language')
    .eq('project_id', projectId)

  if (!files || files.length === 0) {
    return { kind: 'error', code: 'FILES_NOT_FOUND' }
  }

  const projectStack = project.stack ?? []
  const extractedFiles = files.map(file => ({
    path: file.path,
    content: file.content,
    language: file.language,
    sizeBytes: file.content.length,
  }))
  const fileContext = buildFileContext(selectFilesForAnalysis(extractedFiles, 20_000, projectStack))

  const ok = await consumeCredits(userId, CREDIT_COSTS.change_proposal, 'change_proposal', projectId)
  if (!ok) {
    return { kind: 'error', code: 'INSUFFICIENT_CREDITS' }
  }

  let proposal: GeneratedProposal
  try {
    proposal = await generateProposal(intent, fileContext, projectStack)
  } catch (error) {
    await refundCredits(userId, projectId, CREDIT_COSTS.change_proposal)
    console.error('createProposal: generation failed', error)
    return { kind: 'error', code: 'PROPOSAL_GENERATION_FAILED' }
  }

  const { data: saved, error: saveError } = await supabase
    .from('change_proposals')
    .insert({
      project_id: projectId,
      user_id: userId,
      intent,
      change_type: proposal.change_type,
      difficulty: proposal.difficulty,
      candidates: proposal.candidates,
    })
    .select('id')
    .single()

  if (saveError) {
    await refundCredits(userId, projectId, CREDIT_COSTS.change_proposal)
    console.error('createProposal: insert failed', saveError)
    return { kind: 'error', code: 'PROPOSAL_SAVE_FAILED' }
  }

  return {
    kind: 'ok',
    proposalId: saved?.id ?? null,
    intent,
    proposal,
  }
}
