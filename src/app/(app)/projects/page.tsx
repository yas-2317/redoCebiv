import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProgress } from '@/lib/progress/service'
import ProjectCard from '@/components/project/ProjectCard'
import { PageIntro, SectionHeader } from '@/components/dashboard/primitives'
import { getProjectState } from '@/components/dashboard/helpers'

type ProjectsPageProps = {
  searchParams?: Promise<{
    filter?: string
    sort?: string
  }>
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'needs-attention', label: 'Needs attention' },
  { key: 'recently-recovered', label: 'Recently recovered' },
] as const

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = searchParams ? await searchParams : undefined
  const activeFilter = params?.filter ?? 'all'
  const activeSort = params?.sort ?? 'recent'

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('id, name, status, stack, file_count, created_at, last_activity_at')
    .eq('user_id', user.id)
    .order('last_activity_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const progress = await getUserProgress(user.id)
  const progressByProjectId = new Map(progress.projectRows.map((row) => [row.projectId, row]))
  const projectsWithProgress = (projects ?? []).map((project) => {
    const projectProgress = progressByProjectId.get(project.id)
    const state = getProjectState({
      status: project.status,
      traceCount: projectProgress?.traceCount ?? 0,
      usecaseCount: projectProgress?.usecaseCount ?? 0,
      challengeCount: projectProgress?.challengeCount ?? 0,
      solvedCount: projectProgress?.solvedCount ?? 0,
    })

    return {
      ...project,
      usecaseCount: projectProgress?.usecaseCount ?? 0,
      traceCount: projectProgress?.traceCount ?? 0,
      challengeCount: projectProgress?.challengeCount ?? 0,
      solvedCount: projectProgress?.solvedCount ?? 0,
      state,
    }
  })

  const filteredProjects = projectsWithProgress
    .filter((project) => {
      if (activeFilter === 'active') {
        return project.status === 'ready'
      }

      if (activeFilter === 'needs-attention') {
        return project.state.label === 'Needs attention' || project.state.label === 'Challenge pending'
      }

      if (activeFilter === 'recently-recovered') {
        return project.state.label === 'Recovered this week' || project.solvedCount > 0
      }

      return true
    })
    .sort((left, right) => {
      if (activeSort === 'recovery') {
        return right.solvedCount - left.solvedCount || right.traceCount - left.traceCount
      }

      const leftDate = new Date(left.last_activity_at ?? left.created_at).getTime()
      const rightDate = new Date(right.last_activity_at ?? right.created_at).getTime()
      return rightDate - leftDate
    })

  return (
    <div className="quiet-grid gap-8">
      <PageIntro
        eyebrow="Projects"
        title="Choose a codebase to continue tracing and taking back."
        description="This shelf should feel actionable at a glance: where momentum already exists, what needs attention, and which project is best to resume."
        action={
          <Link
            href="/projects/new"
            className="inline-flex rounded-full bg-[var(--app-brand)] px-5 py-3 text-sm font-medium text-white transition hover:bg-[var(--app-brand)]/92"
          >
            + New project
          </Link>
        }
      />

      <section className="quiet-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => {
              const isActive = filter.key === activeFilter
              const search = new URLSearchParams()
              if (filter.key !== 'all') search.set('filter', filter.key)
              if (activeSort !== 'recent') search.set('sort', activeSort)

              return (
                <Link
                  key={filter.key}
                  href={search.toString() ? `/projects?${search.toString()}` : '/projects'}
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? 'bg-[var(--app-brand)] text-white'
                      : 'border border-[var(--app-border)] bg-white/75 text-[var(--app-muted)] hover:bg-white'
                  }`}
                >
                  {filter.label}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--app-muted)]">
            <span>Sort:</span>
            <Link
              href={activeFilter === 'all' ? '/projects' : `/projects?filter=${activeFilter}`}
              className={`rounded-full px-3 py-2 ${activeSort === 'recent' ? 'bg-white text-[var(--app-text)]' : 'hover:bg-white/70'}`}
            >
              Recent
            </Link>
            <Link
              href={`/projects?${new URLSearchParams({
                ...(activeFilter !== 'all' ? { filter: activeFilter } : {}),
                sort: 'recovery',
              }).toString()}`}
              className={`rounded-full px-3 py-2 ${activeSort === 'recovery' ? 'bg-white text-[var(--app-text)]' : 'hover:bg-white/70'}`}
            >
              Recovery
            </Link>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Project shelf"
          description={`${filteredProjects.length} project${filteredProjects.length === 1 ? '' : 's'} ready to scan.`}
        />

        {filteredProjects.length === 0 ? (
          <div className="quiet-card flex flex-col items-center px-6 py-20 text-center">
            <p className="text-lg font-medium text-[var(--app-text)]">Nothing matches this filter yet.</p>
            <p className="quiet-body mt-3 max-w-md">
              Try another shelf view, or upload a new project to start building a quieter understanding of the code.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                status={project.status}
                stack={project.stack ?? []}
                fileCount={project.file_count}
                createdAt={project.created_at}
                lastActivityAt={project.last_activity_at}
                traceCount={project.traceCount}
                usecaseCount={project.usecaseCount}
                solvedCount={project.solvedCount}
                challengeCount={project.challengeCount}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
