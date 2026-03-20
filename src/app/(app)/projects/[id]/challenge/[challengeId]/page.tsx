import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChallengeView } from '@/components/challenge/ChallengeView'

interface PageProps {
  params: Promise<{ id: string; challengeId: string }>
}

export default async function ChallengePage({ params }: PageProps) {
  const { id: projectId, challengeId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, status')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project || project.status !== 'ready') notFound()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, description, type, difficulty, format, hint, answer')
    .eq('id', challengeId)
    .eq('project_id', projectId)
    .single()

  if (!challenge) notFound()

  // Fetch file paths for the tree (content not needed client-side)
  const { data: files } = await supabase
    .from('project_files')
    .select('path')
    .eq('project_id', projectId)
    .order('path')

  const filePaths = files?.map(f => f.path) ?? []

  // Check for existing submission (to reuse explanation)
  const { data: existingSubmission } = await supabase
    .from('challenge_submissions')
    .select('grade, explanation, selected_files, answer_text, used_hint')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return (
    <div style={{ maxWidth: '720px' }}>
      <nav style={{ fontSize: '13px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '24px' }}>
        <Link href="/projects" style={{ color: '#6b7280', textDecoration: 'none' }}>Projects</Link>
        <span>/</span>
        <Link href={`/projects/${projectId}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{project.name}</Link>
        <span>/</span>
        <span style={{ color: '#111827' }}>{challenge.title}</span>
      </nav>

      <ChallengeView
        projectId={projectId}
        challenge={challenge}
        filePaths={filePaths}
        previousSubmission={existingSubmission ?? null}
      />
    </div>
  )
}
