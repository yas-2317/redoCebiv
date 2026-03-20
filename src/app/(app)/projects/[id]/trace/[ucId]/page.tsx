import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { consumeCredits } from '@/lib/credits'
import { generateTrace } from '@/lib/anthropic/trace'
import { buildFileContext, selectFilesForAnalysis } from '@/lib/zip'
import { TraceView } from '@/components/trace/TraceView'

interface PageProps {
  params: Promise<{ id: string; ucId: string }>
}

export default async function TracePage({ params }: PageProps) {
  const { id: projectId, ucId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // プロジェクト取得（所有権確認 + zip_hash）
  const { data: project } = await supabase
    .from('projects')
    .select('id, name, zip_hash, status')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project || project.status !== 'ready') notFound()

  // ユースケース取得
  const { data: usecase } = await supabase
    .from('usecases')
    .select('id, name, description, related_file_paths')
    .eq('id', ucId)
    .eq('project_id', projectId)
    .single()

  if (!usecase) notFound()

  // キャッシュ確認
  const zipHash = project.zip_hash ?? ''
  const { data: cached } = await supabase
    .from('traces')
    .select('related_files, flow, explanation')
    .eq('usecase_id', ucId)
    .eq('project_zip_hash', zipHash)
    .single()

  if (cached) {
    return (
      <TracePage_UI
        projectId={projectId}
        projectName={project.name}
        trace={{ name: usecase.name, ...cached, cached: true }}
      />
    )
  }

  // クレジット消費
  const ok = await consumeCredits(user.id, 1, 'trace_generate', projectId)
  if (!ok) {
    return (
      <div style={{ maxWidth: '720px', paddingTop: '48px', textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Not enough charts to navigate.</p>
        <Link href={`/projects/${projectId}`} style={{ fontSize: '13px', color: '#1d6187', textDecoration: 'none' }}>
          ← Back to project
        </Link>
      </div>
    )
  }

  // 関連ファイル取得
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

  const { data: files } = await filesQuery
  if (!files || files.length === 0) notFound()

  const extractedFiles = files.map(f => ({
    path: f.path,
    content: f.content,
    language: f.language,
    sizeBytes: f.content.length,
  }))
  const fileContext = buildFileContext(selectFilesForAnalysis(extractedFiles, 20_000))

  // トレース生成
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

  return (
    <TracePage_UI
      projectId={projectId}
      projectName={project.name}
      trace={{ name: usecase.name, ...trace, cached: false }}
    />
  )
}

function TracePage_UI({
  projectId,
  projectName,
  trace,
}: {
  projectId: string
  projectName: string
  trace: {
    name: string
    related_files: { path: string; role: string; keyLines: number[] }[]
    flow: { step: number; label: string; description: string; file: string; line: number }[]
    explanation: string
    cached: boolean
  }
}) {
  return (
    <div>
      <nav style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        <Link href="/projects" style={{ color: '#6b7280', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{projectName}</Link>
        <span>/</span>
        <span style={{ color: '#111827' }}>{trace.name}</span>
      </nav>

      <TraceView
        name={trace.name}
        relatedFiles={trace.related_files ?? []}
        flow={trace.flow ?? []}
        explanation={trace.explanation ?? ''}
        cached={trace.cached}
      />
    </div>
  )
}
