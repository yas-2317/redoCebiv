import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { consumeCredits } from '@/lib/credits'
import { inngest } from '@/lib/inngest/client'

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  const projectName = name.trim() || file.name.replace(/\.zip$/, '')

  // 残高確認のみ（消費はアップロード成功後）
  const { data: profile } = await supabase
    .from('profiles')
    .select('credit_balance')
    .eq('id', user.id)
    .single()

  if (!profile || profile.credit_balance < 5) {
    return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 402 })
  }

  // プロジェクト作成
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({ user_id: user.id, name: projectName, status: 'uploading' })
    .select('id')
    .single()

  if (projectError || !project) {
    console.error('Project insert error:', projectError)
    return NextResponse.json({ error: 'DB_ERROR', detail: projectError?.message }, { status: 500 })
  }

  // Supabase Storage にアップロード（service role で権限を確保）
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const storagePath = `${user.id}/${project.id}/source.zip`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await serviceClient.storage
    .from('project_zips')
    .upload(storagePath, buffer, { contentType: 'application/zip' })

  if (uploadError) {
    console.error('Storage upload error:', uploadError)
    await supabase.from('projects').delete().eq('id', project.id)
    return NextResponse.json({ error: 'UPLOAD_FAILED', detail: uploadError.message }, { status: 500 })
  }

  // アップロード成功後にクレジット消費
  const ok = await consumeCredits(user.id, 5, 'initial_analysis', project.id)
  if (!ok) {
    // 万が一ここで残高不足になった場合もロールバック
    await serviceClient.storage.from('project_zips').remove([storagePath])
    await supabase.from('projects').delete().eq('id', project.id)
    return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 402 })
  }

  // status を analyzing に更新
  await supabase
    .from('projects')
    .update({ status: 'analyzing', zip_storage_path: storagePath })
    .eq('id', project.id)

  // Inngest ジョブを起動
  await inngest.send({ name: 'project/analyze', data: { projectId: project.id } })

  return NextResponse.json({ projectId: project.id }, { status: 202 })
}
