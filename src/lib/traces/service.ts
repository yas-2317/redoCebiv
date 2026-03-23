import { CREDIT_COSTS } from '@/lib/billing/config'
import { consumeCredits } from '@/lib/credits'
import { createRefundClient, refundCredits as refundCreditsRpc } from '@/lib/credits/refund'
import { generateTrace, type GeneratedTrace } from '@/lib/anthropic/trace'
import { logRecoveryEvent } from '@/lib/recovery-events/service'
import { buildFileContext, selectFilesForAnalysis } from '@/lib/zip'
import { createClient } from '@/lib/supabase/server'

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

type TraceErrorCode =
  | 'PROJECT_NOT_FOUND'
  | 'PROJECT_NOT_READY'
  | 'USECASE_NOT_FOUND'
  | 'FILES_NOT_FOUND'
  | 'INSUFFICIENT_CREDITS'
  | 'TRACE_GENERATION_FAILED'
  | 'TRACE_SAVE_FAILED'

interface TracePayload extends GeneratedTrace {
  generated_at?: string
}

type TraceServiceResult =
  | {
      kind: 'ok'
      projectName: string
      usecaseName: string
      trace: TracePayload
      cached: boolean
    }
  | {
      kind: 'error'
      code: TraceErrorCode
    }

async function refundCredits(userId: string, projectId: string, amount: number) {
  const serviceClient = createRefundClient()
  await refundCreditsRpc(serviceClient, {
    userId,
    amount,
    projectId,
  })
}

export async function getOrCreateTrace(params: {
  supabase: ServerSupabase
  userId: string
  projectId: string
  usecaseId: string
}): Promise<TraceServiceResult> {
  const { supabase, userId, projectId, usecaseId } = params

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, name, zip_hash, status, stack')
    .eq('id', projectId)
    .eq('user_id', userId)
    .single()

  if (projectError || !project) {
    return { kind: 'error', code: 'PROJECT_NOT_FOUND' }
  }

  if (project.status !== 'ready') {
    return { kind: 'error', code: 'PROJECT_NOT_READY' }
  }

  const { data: usecase, error: usecaseError } = await supabase
    .from('usecases')
    .select('id, name, description, related_file_paths')
    .eq('id', usecaseId)
    .eq('project_id', projectId)
    .single()

  if (usecaseError || !usecase) {
    return { kind: 'error', code: 'USECASE_NOT_FOUND' }
  }

  const zipHash = project.zip_hash ?? ''
  const { data: cached } = await supabase
    .from('traces')
    .select('related_files, flow, explanation, generated_at')
    .eq('usecase_id', usecaseId)
    .eq('project_zip_hash', zipHash)
    .single()

  if (cached) {
    return {
      kind: 'ok',
      projectName: project.name,
      usecaseName: usecase.name,
      trace: cached,
      cached: true,
    }
  }

  const relatedPaths: string[] = usecase.related_file_paths ?? []
  const safePaths = relatedPaths.filter(
    path => typeof path === 'string' && !path.includes('..') && !path.startsWith('/')
  )

  if (relatedPaths.length > 0 && safePaths.length === 0) {
    return { kind: 'error', code: 'FILES_NOT_FOUND' }
  }

  let filesQuery = supabase
    .from('project_files')
    .select('path, content, language')
    .eq('project_id', projectId)

  if (safePaths.length > 0) {
    filesQuery = filesQuery.in('path', safePaths)
  } else {
    filesQuery = filesQuery.limit(10)
  }

  const { data: files, error: filesError } = await filesQuery
  if (filesError || !files || files.length === 0) {
    return { kind: 'error', code: 'FILES_NOT_FOUND' }
  }

  const ok = await consumeCredits(userId, CREDIT_COSTS.trace_generate, 'trace_generate', projectId)
  if (!ok) {
    return { kind: 'error', code: 'INSUFFICIENT_CREDITS' }
  }

  const extractedFiles = files.map(file => ({
    path: file.path,
    content: file.content,
    language: file.language,
    sizeBytes: file.content.length,
  }))
  const fileContext = buildFileContext(selectFilesForAnalysis(extractedFiles, 20_000, project.stack ?? []))

  let trace: GeneratedTrace
  try {
    trace = await generateTrace(
      { name: usecase.name, description: usecase.description },
      fileContext,
      project.stack ?? []
    )
  } catch (error) {
    await refundCredits(userId, projectId, CREDIT_COSTS.trace_generate)
    console.error('getOrCreateTrace: generation failed', error)
    return { kind: 'error', code: 'TRACE_GENERATION_FAILED' }
  }

  const { error: insertError } = await supabase.from('traces').insert({
    usecase_id: usecaseId,
    project_zip_hash: zipHash,
    related_files: trace.related_files,
    flow: trace.flow,
    explanation: trace.explanation,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      await refundCredits(userId, projectId, CREDIT_COSTS.trace_generate)
      const { data: existing } = await supabase
        .from('traces')
        .select('related_files, flow, explanation, generated_at')
        .eq('usecase_id', usecaseId)
        .eq('project_zip_hash', zipHash)
        .single()

      if (existing) {
        return {
          kind: 'ok',
          projectName: project.name,
          usecaseName: usecase.name,
          trace: existing,
          cached: true,
        }
      }

      console.error('getOrCreateTrace: duplicate insert but existing trace not found', insertError)
      return { kind: 'error', code: 'TRACE_SAVE_FAILED' }
    }

    await refundCredits(userId, projectId, CREDIT_COSTS.trace_generate)
    console.error('getOrCreateTrace: insert failed', insertError)
    return { kind: 'error', code: 'TRACE_SAVE_FAILED' }
  }

  await logRecoveryEvent({
    supabase,
    userId,
    projectId,
    usecaseId,
    eventType: 'trace_generated',
    title: usecase.name,
    detail: usecase.description,
  })

  return {
    kind: 'ok',
    projectName: project.name,
    usecaseName: usecase.name,
    trace,
    cached: false,
  }
}
