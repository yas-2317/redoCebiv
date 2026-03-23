import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserProgress } from '@/lib/progress/service'
import {
  ActivityList,
  MetricCard,
  PageIntro,
  ProgressBarRow,
  SectionHeader,
  SurfaceCard,
} from '@/components/dashboard/primitives'
import { formatRelative, getActivityMeta, getProjectState } from '@/components/dashboard/helpers'

export default async function ProgressPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const progress = await getUserProgress(user.id)
  const { summary, projectRows, stackRows } = progress

  const [{ data: submissions }, { data: traces }] = await Promise.all([
    supabase
      .from('challenge_submissions')
      .select('id, grade, created_at, challenges(title, projects(name))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40),
    supabase
      .from('traces')
      .select('id, generated_at, usecases(name, projects(name))')
      .order('generated_at', { ascending: false })
      .limit(40),
  ])

  const solvedThisWeek = (submissions ?? []).filter((item) => {
    const createdAt = new Date(item.created_at)
    const threshold = new Date()
    threshold.setDate(threshold.getDate() - 7)
    return createdAt >= threshold && item.grade === 'self'
  }).length

  const activities = [
    ...(submissions ?? []).map((submission) => {
      const meta = getActivityMeta(submission.grade)
      return {
        ...meta,
        title: (submission.challenges as unknown as { title: string } | null)?.title ?? 'Challenge',
        projectName: ((submission.challenges as unknown as { projects: { name: string } | null } | null)?.projects)?.name ?? '',
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

  return (
    <div className="quiet-grid gap-8">
      <PageIntro
        eyebrow="Progress"
        title="Recovery becomes believable when the pattern is visible."
        description="This page should feel like a calm ledger of understanding: what you have already reclaimed, where you still need support, and which stacks are becoming familiar."
      />

      <SurfaceCard strong>
        <p className="quiet-eyebrow">Your recovery</p>
        <h2 className="mt-4 text-[clamp(2rem,3vw,3.2rem)] leading-none font-semibold tracking-[-0.05em] text-[var(--app-text)]">
          You&apos;ve taken back {summary.selfSolvedChallenges} concepts.
        </h2>
        <p className="quiet-body mt-4">{solvedThisWeek} solved on your own this week.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryStat label="Self-solved rate" value={`${summary.masteryRate}%`} />
          <SummaryStat label="Traces completed" value={summary.totalTraces} />
          <SummaryStat label="Challenges attempted" value={summary.attemptedChallenges} />
        </div>
      </SurfaceCard>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,0.85fr))]">
        <MetricCard
          label="Got it back"
          helper="Solved on your own"
          value={summary.selfSolvedChallenges}
          tone="success"
          prominent
          footer={<p className="quiet-meta">Recovery looks steadier when the code starts to read like your own idea.</p>}
        />
        <MetricCard label="Needed a nudge" helper="Solved with a hint" value={summary.hintSolvedChallenges} tone="hint" />
        <MetricCard label="Not yet" helper="Still unclear" value={summary.missedChallenges} tone="missed" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <SurfaceCard>
          <SectionHeader title="By stack" description="Growth by stack should feel readable, not technical for its own sake." />
          <div className="space-y-6">
            {stackRows.length === 0 ? (
              <p className="quiet-meta">No stack data yet.</p>
            ) : (
              stackRows.map((stack) => (
                <div key={stack.stackLabel} className="rounded-[20px] border border-[var(--app-border)] bg-white/76 p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <span className="rounded-full bg-[var(--app-brand-soft)] px-3 py-1 text-sm font-medium text-[var(--app-brand)]">
                      {stack.stackLabel}
                    </span>
                    <span className="quiet-meta">{stack.masteryRate}% recovered ratio</span>
                  </div>
                  <div className="space-y-4">
                    <ProgressBarRow
                      label="Traced"
                      helper="Features you have followed end to end"
                      value={stack.totalTraces}
                      max={stack.totalFeatures}
                      tone="brand"
                    />
                    <ProgressBarRow
                      label="Got it back"
                      helper="Challenges solved on your own"
                      value={stack.selfSolvedChallenges}
                      max={stack.totalChallenges}
                      tone="success"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </SurfaceCard>

        <SurfaceCard>
          <SectionHeader title="By project" description="A project-level learning summary helps you choose the next good return point." />
          <div className="space-y-4">
            {projectRows.map((project) => {
              const state = getProjectState({
                status: project.status,
                traceCount: project.traceCount,
                usecaseCount: project.usecaseCount,
                challengeCount: project.challengeCount,
                solvedCount: project.solvedCount,
              })

              return (
                <div key={project.projectId} className="rounded-[20px] border border-[var(--app-border)] bg-white/76 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--app-text)]">{project.projectName}</p>
                      <p className="quiet-meta mt-2">{state.summary}</p>
                    </div>
                    <span className="rounded-full bg-[var(--app-brand-soft)] px-3 py-1 text-xs font-medium text-[var(--app-brand)]">
                      {state.label}
                    </span>
                  </div>
                  <div className="mt-5 space-y-4">
                    <ProgressBarRow label="Traced" value={project.traceCount} max={project.usecaseCount} tone="brand" />
                    <ProgressBarRow label="Got it back" value={project.selfSolvedChallenges} max={project.challengeCount} tone="success" />
                  </div>
                </div>
              )
            })}
          </div>
        </SurfaceCard>
      </div>

      <section>
        <SectionHeader title="Recent learning log" description="The most recent signs that your understanding moved." />
        <ActivityList
          items={activities}
          empty={<p className="quiet-meta">No learning activity yet.</p>}
        />
      </section>
    </div>
  )
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[20px] border border-[var(--app-border)] bg-white/78 p-5">
      <p className="quiet-meta">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">{value}</p>
    </div>
  )
}
