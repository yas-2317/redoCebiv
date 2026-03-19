import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { consumeCredits } from '@/lib/credits'
import { generateProposal } from '@/lib/anthropic/proposal'
import { buildFileContext, selectFilesForAnalysis } from '@/lib/zip'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json() as { intent?: string }
  const intent = body.intent?.trim()
  if (!intent) {
    return NextResponse.json({ error: 'MISSING_INTENT' }, { status: 400 })
  }

  // プロジェクト取得（所有権確認）
  const { data: project } = await supabase
    .from('projects')
    .select('id, status')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project || project.status !== 'ready') {
    return NextResponse.json({ error: 'PROJECT_NOT_FOUND' }, { status: 404 })
  }

  // クレジット消費
  const ok = await consumeCredits(user.id, 2, 'change_proposal', projectId)
  if (!ok) {
    return NextResponse.json({ error: 'INSUFFICIENT_CREDITS' }, { status: 402 })
  }

  // ファイル取得（20kトークン上限）
  const { data: files } = await supabase
    .from('project_files')
    .select('path, content, language')
    .eq('project_id', projectId)

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'FILES_NOT_FOUND' }, { status: 404 })
  }

  const extractedFiles = files.map(f => ({
    path: f.path,
    content: f.content,
    language: f.language,
    sizeBytes: f.content.length,
  }))
  const fileContext = buildFileContext(selectFilesForAnalysis(extractedFiles, 20_000))

  // 変更候補生成
  const proposal = await generateProposal(intent, fileContext)

  // DB保存
  const { data: saved } = await supabase
    .from('change_proposals')
    .insert({
      project_id: projectId,
      user_id: user.id,
      intent,
      change_type: proposal.change_type,
      difficulty: proposal.difficulty,
      candidates: proposal.candidates,
    })
    .select('id')
    .single()

  return NextResponse.json({
    id: saved?.id,
    intent,
    ...proposal,
  })
}
