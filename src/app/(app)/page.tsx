import Link from 'next/link'
import { FolderOpen, Layers, Map as MapIcon, Search, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getUserProgress } from '@/lib/progress/service'
import ProjectCard from '@/components/project/ProjectCard'
import {
  ActivityList,
  HeroCard,
  MetricCard,
  PageIntro,
  SectionHeader,
  StatChip,
  SurfaceCard,
} from '@/components/dashboard/primitives'
import { FootprintList } from '@/components/dashboard/FootprintList'
import { formatRelative, getActivityMeta, pluralize } from '@/components/dashboard/helpers'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function HomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const progress = await getUserProgress(user!.id)
  const { summary, projectRows } = progress

  const [{ data: allProjects }, { data: submissions }, { data: traces }, { data: transactions }] = await Promise.all([
    supabase
      .from('projects')
      .select('id, name, status, stack, file_count, created_at, last_activity_at')
      .eq('user_id', user!.id)
      .order('last_activity_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    supabase
      .from('challenge_submissions')
      .select('id, grade, created_at, challenges(title, projects(name, id))')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(60),
    supabase
      .from('traces')
      .select('id, generated_at, usecase_id, usecases(name, project_id, projects(name, id))')
      .order('generated_at', { ascending: false })
      .limit(60),
    supabase
      .from('credit_transactions')
      .select('amount')
      .eq('user_id', user!.id)
      .lt('amount', 0),
  ])

  const projects = allProjects ?? []
  const recentProjects = projects.slice(0, 4)
  const progressByProjectId = new Map(projectRows.map((row) => [row.projectId, row]))
  const recentProjectsWithProgress = recentProjects.map((project) => {
    const progressRow = progressByProjectId.get(project.id)

    return {
      ...project,
      traceCount: progressRow?.traceCount ?? 0,
      usecaseCount: progressRow?.usecaseCount ?? 0,
      solvedCount: progressRow?.solvedCount ?? 0,
      challengeCount: progressRow?.challengeCount ?? 0,
    }
  })

  const chartsLogged = (transactions ?? []).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)

  const chartDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - index))
    date.setHours(0, 0, 0, 0)
    return date
  })

  const chartData = chartDays.map((day) => {
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    const traceTotal = (traces ?? []).filter((item) => {
      const timestamp = new Date(item.generated_at)
      return timestamp >= day && timestamp < next
    }).length
    const challengeTotal = (submissions ?? []).filter((item) => {
      const timestamp = new Date(item.created_at)
      return timestamp >= day && timestamp < next
    }).length

    return { day, traces: traceTotal, challenges: challengeTotal, total: traceTotal + challengeTotal }
  })

  const thisWeekTraces = chartData.reduce((sum, day) => sum + day.traces, 0)
  const thisWeekChallenges = chartData.reduce((sum, day) => sum + day.challenges, 0)
  const thisWeekRecovered = (submissions ?? []).filter((submission) => {
    const createdAt = new Date(submission.created_at)
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 7)
    return createdAt >= threshold && submission.grade === 'self'
  }).length

  const latestReadyProject = projects.find((project) => project.status === 'ready') ?? projects[0]

  const activities = [
    ...(submissions ?? []).map((submission) => {
      const meta = getActivityMeta(submission.grade)
      return {
        ...meta,
        title: (submission.challenges as unknown as { title: string } | null)?.title ?? 'Challenge',
        projectName:
          ((submission.challenges as unknown as { projects: { name: string } | null } | null)?.projects)?.name ?? '',
        timestamp: formatRelative(submission.created_at),
        createdAt: submission.created_at,
      }
    }),
    ...(traces ?? []).map((trace) => ({
      ...getActivityMeta(),
      title: (trace.usecases as unknown as { name: string } | null)?.name ?? 'Trace',
      projectName: ((trace.usecases as unknown as { projects: { name: string } | null } | null)?.projects)?.name ?? '',
      timestamp: formatRelative(trace.generated_at),
      createdAt: trace.generated_at,
    })),
  ]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)
    .map((item) => ({
      badgeLabel: item.badgeLabel,
      badgeTone: item.badgeTone,
      title: item.title,
      projectName: item.projectName,
      timestamp: item.timestamp,
    }))

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="mb-6 h-14 w-auto dark:invert" />
        <h1 className="quiet-title max-w-2xl text-center">You sparked it. Now let&apos;s trace it back to you.</h1>
        <p className="quiet-body mt-4 max-w-lg">
          Upload what you built. We&apos;ll work backwards until it feels legible, navigable, and yours again.
        </p>
        <Link
          href="/projects/new"
          className="mt-8 rounded-full bg-[var(--app-brand)] px-6 py-3 text-sm font-medium text-white transition hover:bg-[var(--app-brand)]/92"
        >
          + New project
        </Link>
      </div>
    )
  }

  return (
    <div className="quiet-grid gap-8">
      <PageIntro
        eyebrow="Home"
        title="A quiet briefing for what comes next."
        description="Your dashboard should answer three things quickly: what to do next, how much you have already taken back, and where your understanding is growing."
      />

      <HeroCard
        eyebrow="Today’s recovery"
        title="You&apos;re getting it back."
        description={`This week, you completed ${pluralize(thisWeekTraces, 'trace')} and attempted ${pluralize(thisWeekChallenges, 'challenge')}.`}
        note="AI wrote it first. You understand it now."
        stats={[
          { label: 'active projects', value: `${projects.filter((project) => project.status === 'ready').length}` },
          { label: 'concepts recovered', value: `${summary.selfSolvedChallenges}` },
        ]}
        primaryAction={{
          href: latestReadyProject?.status === 'ready' ? `/projects/${latestReadyProject.id}` : '/projects',
          label: 'Continue tracing',
        }}
        secondaryAction={{
          href: latestReadyProject ? `/projects/${latestReadyProject.id}` : '/projects',
          label: 'Open latest project',
        }}
        aside={
          <div className="space-y-2">
            <p className="text-sm font-medium text-[var(--app-text)]">
              {projects.filter((project) => project.status === 'ready').length} active projects
            </p>
            <p className="quiet-meta">The dashboard is strongest when it keeps your next step close to hand.</p>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Got it back" helper="Solved on your own" value={summary.selfSolvedChallenges} tone="success" prominent />
        <MetricCard label="Needed a nudge" helper="Solved with a hint" value={summary.hintSolvedChallenges} tone="hint" />
        <MetricCard label="Not yet" helper="Still unclear" value={summary.missedChallenges} tone="missed" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <SurfaceCard>
          <SectionHeader title="This week" description="A simple reading of the rhythm you kept." />
          <div className="grid gap-4 md:grid-cols-3">
            <StatChip icon={Search} label="Traces completed" value={thisWeekTraces} />
            <StatChip icon={Trophy} label="Challenges attempted" value={thisWeekChallenges} />
            <StatChip icon={Layers} label="Recovered count" value={thisWeekRecovered} />
          </div>
          <div className="mt-6">
            <WeeklyBars data={chartData} />
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader title="Your footprint" description="A steady account of how much ground you have covered." />
          <FootprintList
            entries={[
              {
                type: 'group',
                parent: { icon: FolderOpen, label: 'Projects', value: summary.totalProjects, href: '/projects' },
                children: [
                  { icon: Layers, label: 'Features', value: summary.totalFeatures },
                  { icon: Search, label: 'Traces', value: summary.totalTraces },
                ],
              },
              { type: 'item', icon: Trophy, label: 'Challenges', value: summary.totalChallenges, href: '/progress' },
              { type: 'item', icon: MapIcon, label: 'Charts logged', value: chartsLogged, href: '/settings' },
            ]}
          />
        </SurfaceCard>
      </div>

      <section>
        <SectionHeader
          title="Continue where you left off"
          description="A project shelf with the clearest places to resume."
          action={
            <Link href="/projects" className="text-sm font-medium text-[var(--app-brand)]">
              See all
            </Link>
          }
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {recentProjectsWithProgress.map((project) => (
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
      </section>

      <section>
        <SectionHeader title="Recent recovery" description="The latest moments that moved your understanding forward." />
        <ActivityList
          items={activities}
          empty={<p className="quiet-meta">No activity yet. Start with a trace and this log will begin to fill in.</p>}
        />
      </section>
    </div>
  )
}

function WeeklyBars({
  data,
}: {
  data: { day: Date; traces: number; challenges: number; total: number }[]
}) {
  const max = Math.max(...data.map((item) => item.total), 1)

  return (
    <div className="grid grid-cols-7 gap-3">
      {data.map((item) => (
        <div key={item.day.toISOString()} className="flex flex-col items-center gap-3">
          <div className="flex h-36 w-full items-end justify-center gap-1 rounded-[20px] bg-[rgba(33,79,104,0.05)] px-2 py-3">
            <div
              className="w-4 rounded-full bg-[var(--app-brand)]"
              style={{ height: `${Math.max((item.traces / max) * 100, item.traces > 0 ? 10 : 0)}%` }}
            />
            <div
              className="w-4 rounded-full bg-[var(--app-hint)]/70"
              style={{ height: `${Math.max((item.challenges / max) * 100, item.challenges > 0 ? 10 : 0)}%` }}
            />
          </div>
          <div className="text-center">
            <p className="text-xs font-medium text-[var(--app-text)]">{DAY_LABELS[item.day.getDay()]}</p>
            <p className="quiet-meta mt-1">{item.total}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
