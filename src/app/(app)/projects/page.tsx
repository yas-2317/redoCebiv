import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ProjectCard from '@/components/project/ProjectCard'
import type { SupabaseClient } from '@supabase/supabase-js'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, stack, file_count, created_at')
    .eq('user_id', user.id)
    .order('last_activity_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const projectsWithProgress = await enrichProjectsWithProgress(
    supabase, user.id, projects ?? []
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">All projects</h1>
        <Link
          href="/projects/new"
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
        >
          + New project
        </Link>
      </div>

      {projectsWithProgress.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <p className="text-gray-400 text-sm">No projects yet.</p>
          <Link
            href="/projects/new"
            className="mt-4 rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-hover transition-colors"
          >
            Upload your first project
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {projectsWithProgress.map(p => (
            <ProjectCard
              key={p.id}
              id={p.id}
              name={p.name}
              status={p.status}
              stack={p.stack ?? []}
              fileCount={p.file_count}
              createdAt={p.created_at}
              traceCount={p.traceCount}
              usecaseCount={p.usecaseCount}
              solvedCount={p.solvedCount}
              challengeCount={p.challengeCount}
            />
          ))}
        </div>
      )}
    </div>
  )
}

type ProjectRow = {
  id: string
  name: string
  status: string
  stack: string[] | null
  file_count: number | null
  created_at: string
}

export async function enrichProjectsWithProgress(
  supabase: SupabaseClient,
  userId: string,
  projects: ProjectRow[]
) {
  const readyIds = projects.filter(p => p.status === 'ready').map(p => p.id)
  if (readyIds.length === 0) return projects.map(p => ({ ...p, traceCount: 0, usecaseCount: 0, solvedCount: 0, challengeCount: 0 }))

  const [{ data: usecaseCounts }, { data: traceCounts }, { data: challengeCounts }, { data: submissionCounts }] =
    await Promise.all([
      supabase
        .from('usecases')
        .select('project_id')
        .in('project_id', readyIds),
      supabase
        .from('traces')
        .select('usecase_id, usecases!inner(project_id)')
        .in('usecases.project_id', readyIds),
      supabase
        .from('challenges')
        .select('id, project_id')
        .in('project_id', readyIds)
        .eq('status', 'active'),
      supabase
        .from('challenge_submissions')
        .select('challenge_id, challenges!inner(project_id)')
        .eq('user_id', userId)
        .in('challenges.project_id', readyIds)
        .neq('grade', 'missed'),
    ])

  const ucByProject: Record<string, number> = {}
  for (const uc of usecaseCounts ?? []) {
    ucByProject[uc.project_id] = (ucByProject[uc.project_id] ?? 0) + 1
  }

  const traceByProject: Record<string, number> = {}
  for (const t of traceCounts ?? []) {
    const pid = (t.usecases as unknown as { project_id: string }).project_id
    traceByProject[pid] = (traceByProject[pid] ?? 0) + 1
  }

  const chByProject: Record<string, number> = {}
  for (const ch of challengeCounts ?? []) {
    chByProject[ch.project_id] = (chByProject[ch.project_id] ?? 0) + 1
  }

  const chIdToProject: Record<string, string> = {}
  for (const ch of challengeCounts ?? []) {
    chIdToProject[ch.id] = ch.project_id
  }

  const solvedByProject: Record<string, Set<string>> = {}
  for (const s of submissionCounts ?? []) {
    const pid = (s.challenges as unknown as { project_id: string }).project_id
    if (!solvedByProject[pid]) solvedByProject[pid] = new Set()
    solvedByProject[pid].add(s.challenge_id)
  }

  return projects.map(p => ({
    ...p,
    usecaseCount: ucByProject[p.id] ?? 0,
    traceCount: traceByProject[p.id] ?? 0,
    challengeCount: chByProject[p.id] ?? 0,
    solvedCount: solvedByProject[p.id]?.size ?? 0,
  }))
}
