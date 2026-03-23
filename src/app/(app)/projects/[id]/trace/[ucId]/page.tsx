import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateTrace } from '@/lib/traces/service'
import { TraceView } from '@/components/trace/TraceView'

interface PageProps {
  params: Promise<{ id: string; ucId: string }>
}

export default async function TracePage({ params }: PageProps) {
  const { id: projectId, ucId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const result = await getOrCreateTrace({
    supabase,
    userId: user.id,
    projectId,
    usecaseId: ucId,
  })

  if (result.kind === 'error') {
    if (result.code === 'INSUFFICIENT_CREDITS') {
      return (
        <div style={{ maxWidth: '720px', paddingTop: '48px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>Not enough charts to navigate.</p>
          <Link href={`/projects/${projectId}`} style={{ fontSize: '13px', color: '#1d6187', textDecoration: 'none' }}>
            ← Back to project
          </Link>
        </div>
      )
    }

    if (result.code === 'TRACE_SAVE_FAILED' || result.code === 'TRACE_GENERATION_FAILED') {
      throw new Error(result.code)
    }

    notFound()
  }

  return (
    <TracePage_UI
      projectId={projectId}
      projectName={result.projectName}
      trace={{ name: result.usecaseName, ...result.trace, cached: result.cached }}
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
