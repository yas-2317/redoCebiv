import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { consumeCredits } from '@/lib/credits'
import { generateTrace } from '@/lib/anthropic/trace'
import { buildFileContext } from '@/lib/zip'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; ucId: string }> }
) {
  const { id: projectId, ucId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // プロジェクト取得（所有権確認 + zip_hash取得）
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id, zip_hash, status')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
  }

  if (project.status !== 'ready') {
    return NextResponse.json({ error: 'PROJECT_NOT_READY' }, { status: 400 })
  }

  // ユースケース取得
  const { data: usecase, error: ucError } = await supabase
    .from('usecases')
    .select('id, name, description, related_file_paths')
    .eq('id', ucId)
    .eq('project_id', projectId)
    .single()

  if (ucError || !usecase) {
    return NextResponse.json({ error: 'USECASE_NOT_FOUND' }, { status: 404 })
  }

  // キャッシュ確認
  const zipHash = project.zip_hash ?? ''
  const { data: cached } = await supabase
    .from('traces')
    .select('related_files, flow, explanation, generated_at')
    .eq('usecase_id', ucId)
    .eq('project_zip_hash', zipHash)
    .single()

  if (cached) {
    return NextResponse.json({
      usecase_id: ucId,
      name: usecase.name,
      ...cached,
      cached: true,
    })
  }

  // 関連ファイルをDBから取得（クレジット消費前に確認）
  const relatedPaths: string[] = usecase.related_file_paths ?? []
  let filesQuery = supabase
    .from('project_files')
    .select('path, content, language')
    .eq('project_id', projectId)

  if (relatedPaths.length > 0) {
    filesQuery = filesQuery.in('path', relatedPaths)
  } else {
    filesQuery = filesQuery.limit(10)
  }

  const { data: files, error: filesError } = await filesQuery

  if (filesError || !files || files.length === 0) {
    return NextResponse.json({ error: 'FILES_NOT_FOUND' }, { status: 404 })
  }

  // クレジット消費（ファイル確認後）
  const ok = await consumeCredits(user.id, 1, 'trace_generate', projectId)
  if (!ok) {
    return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 402 })
  }

  // buildFileContextに合わせた形式に変換
  const extractedFiles = files.map(f => ({
    path: f.path,
    content: f.content,
    language: f.language,
    sizeBytes: f.content.length,
  }))
  const fileContext = buildFileContext(extractedFiles)

  // Claude Haikuでトレース生成
  const trace = await generateTrace(
    { name: usecase.name, description: usecase.description },
    fileContext
  )

  // DB保存（UNIQUE制約違反 = 同時リクエストによる重複）
  const { error: insertError } = await supabase.from('traces').insert({
    usecase_id: ucId,
    project_zip_hash: zipHash,
    related_files: trace.related_files,
    flow: trace.flow,
    explanation: trace.explanation,
  })

  if (insertError) {
    // 重複挿入 → クレジット返金 + 既存traceを返す
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    await serviceClient.rpc('refund_credits', {
      p_user_id: user.id,
      p_amount: 1,
      p_project_id: projectId,
    })
    const { data: existing } = await supabase
      .from('traces')
      .select('related_files, flow, explanation, generated_at')
      .eq('usecase_id', ucId)
      .eq('project_zip_hash', zipHash)
      .single()
    return NextResponse.json({
      usecase_id: ucId,
      name: usecase.name,
      ...existing,
      cached: true,
    })
  }

  return NextResponse.json({
    usecase_id: ucId,
    name: usecase.name,
    related_files: trace.related_files,
    flow: trace.flow,
    explanation: trace.explanation,
    cached: false,
  })
}
