import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient, type SupabaseClient } from '@supabase/supabase-js'
import { CREDIT_COSTS } from '@/lib/billing/config'
import { consumeCredits } from '@/lib/credits'
import { refundCredits } from '@/lib/credits/refund'
import { inngest } from '@/lib/inngest/client'
import { extractZip, hasZipMagicBytes } from '@/lib/zip'
import { enforceRateLimit, RATE_LIMITS, rateLimitExceededResponse } from '@/lib/security/rate-limit'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

async function refundCreditsWithAudit(params: {
  serviceClient: SupabaseClient
  userId: string
  projectId: string
  amount: number
  reason: 'upload_failed' | 'queue_failed'
}) {
  const { serviceClient, userId, projectId, amount, reason } = params

  const { error } = await refundCredits(serviceClient, {
    userId,
    amount,
    projectId,
  })

  if (error) {
    console.error('refund_credits failed', {
      userId,
      projectId,
      amount,
      reason,
      error,
    })
    return false
  }

  return true
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const allowed = await enforceRateLimit({
    supabase,
    actorKey: user.id,
    ...RATE_LIMITS.projectUpload,
  })
  if (!allowed) {
    return rateLimitExceededResponse()
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const name = (formData.get('name') as string | null) ?? ''

  // バリデーション
  if (!file) {
    return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 })
  }
  if (!file.name.endsWith('.zip')) {
    return NextResponse.json({ error: 'INVALID_FILE' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: 'FILE_TOO_LARGE' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  if (!hasZipMagicBytes(buffer)) {
    return NextResponse.json({ error: 'INVALID_FILE' }, { status: 400 })
  }

  try {
    extractZip(buffer)
  } catch (error) {
    console.error('ZIP validation error:', error)
    return NextResponse.json({ error: 'INVALID_ZIP' }, { status: 400 })
  }

  const projectName = name.trim() || file.name.replace(/\.zip$/, '')

  // プロジェクト作成
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({ user_id: user.id, name: projectName, status: 'uploading' })
    .select('id')
    .single()

  if (projectError || !project) {
    console.error('Project insert error:', projectError)
    return NextResponse.json({ error: 'DB_ERROR' }, { status: 500 })
  }

  // 先にアトミックに消費してから外部副作用へ進む
  const ok = await consumeCredits(user.id, CREDIT_COSTS.initial_analysis, 'initial_analysis', project.id)
  if (!ok) {
    await supabase.from('projects').delete().eq('id', project.id)
    return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 402 })
  }

  // Supabase Storage にアップロード（service role で権限を確保）
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const storagePath = `${user.id}/${project.id}/source.zip`

  const { error: uploadError } = await serviceClient.storage
    .from('project_zips')
    .upload(storagePath, buffer, { contentType: 'application/zip' })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    const refunded = await refundCreditsWithAudit({
      serviceClient,
      userId: user.id,
      projectId: project.id,
      amount: CREDIT_COSTS.initial_analysis,
      reason: 'upload_failed',
    })

    if (refunded) {
      await supabase.from('projects').delete().eq('id', project.id)
    } else {
      await supabase
        .from('projects')
        .update({
          status: 'error',
          error_message: 'Upload failed and credit refund requires manual review.',
        })
        .eq('id', project.id)
    }

    return NextResponse.json({ error: 'UPLOAD_FAILED' }, { status: 500 })
  }

  // status を analyzing に更新
  await supabase
    .from('projects')
    .update({ status: 'analyzing', zip_storage_path: storagePath })
    .eq('id', project.id)

  // Inngest ジョブを起動
  try {
    await inngest.send({ name: 'project/analyze', data: { projectId: project.id } })
  } catch (err) {
    console.error('Inngest send error:', err)
    const refunded = await refundCreditsWithAudit({
      serviceClient,
      userId: user.id,
      projectId: project.id,
      amount: CREDIT_COSTS.initial_analysis,
      reason: 'queue_failed',
    })

    await supabase
      .from('projects')
      .update({
        status: 'error',
        error_message: refunded
          ? 'Analysis job setup failed. Please try again.'
          : 'Analysis job setup failed and credit refund requires manual review.',
      })
      .eq('id', project.id)

    return NextResponse.json({ error: 'QUEUE_FAILED' }, { status: 500 })
  }

  return NextResponse.json({ projectId: project.id }, { status: 202 })
}
