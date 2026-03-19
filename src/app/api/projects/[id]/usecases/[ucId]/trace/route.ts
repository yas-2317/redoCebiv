import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
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

  // クレジット消費（キャッシュミス時のみ）
  const ok = await consumeCredits(user.id, 1, 'trace_generate', projectId)
  if (!ok) {
    return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 402 })
  }

  // 関連ファイルをDBから取得
  const relatedPaths: string[] = usecase.related_file_paths ?? []
  let filesQuery = supabase
    .from('project_files')
    .select('path, content, language')
    .eq('project_id', projectId)

  if (relatedPaths.length > 0) {
    filesQuery = filesQuery.in('path', relatedPaths)
  } else {
    // related_file_pathsが空の場合は最大10件取得
    filesQuery = filesQuery.limit(10)
  }

  const { data: files, error: filesError } = await filesQuery

  if (filesError || !files || files.length === 0) {
    return NextResponse.json({ error: 'FILES_NOT_FOUND' }, { status: 404 })
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

  // DB保存
  await supabase.from('traces').insert({
    usecase_id: ucId,
    project_zip_hash: zipHash,
    related_files: trace.related_files,
    flow: trace.flow,
    explanation: trace.explanation,
  })

  return NextResponse.json({
    usecase_id: ucId,
    name: usecase.name,
    related_files: trace.related_files,
    flow: trace.flow,
    explanation: trace.explanation,
    cached: false,
  })
}
