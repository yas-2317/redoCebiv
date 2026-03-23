import { MetricCard, ProgressBarRow, SurfaceCard, StateBadge } from '@/components/dashboard/primitives'

export function ProjectRecoveryCard({
  tracedCount,
  totalUsecases,
  solvedCount,
  totalChallenges,
  gotItBackCount,
  momentumLabel,
  momentumNote,
}: {
  tracedCount: number
  totalUsecases: number
  solvedCount: number
  totalChallenges: number
  gotItBackCount: number
  momentumLabel: string
  momentumNote: string
}) {
  return (
    <SurfaceCard strong className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="quiet-eyebrow">Project recovery</p>
          <h2 className="mt-3 text-[clamp(1.8rem,2.8vw,2.6rem)] leading-none font-semibold tracking-[-0.05em] text-[var(--app-text)]">
            This codebase is becoming yours again.
          </h2>
          <p className="quiet-body mt-4 max-w-2xl">
            Trace the feature, then explain it in your own words. Challenges verify whether the code now feels like yours.
          </p>
        </div>
        <div className="shrink-0">
          <StateBadge label={momentumLabel} tone={momentumLabel === 'steady' ? 'success' : momentumLabel === 'building' ? 'brand' : 'default'} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))]">
        <MetricCard
          label="Traced features"
          helper="Followed through the code path"
          value={`${tracedCount} / ${totalUsecases}`}
          tone="default"
          footer={<ProgressBarRow label="Trace progress" value={tracedCount} max={totalUsecases} tone="brand" />}
        />
        <MetricCard
          label="Challenges solved"
          helper="Understanding checks completed"
          value={`${solvedCount} / ${totalChallenges}`}
          tone="hint"
        />
        <MetricCard
          label="Got it back"
          helper="Solved on your own"
          value={gotItBackCount}
          tone="success"
          prominent
          footer={<p className="quiet-meta">{momentumNote}</p>}
        />
      </div>
    </SurfaceCard>
  )
}
