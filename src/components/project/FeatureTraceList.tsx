import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionHeader, StateBadge, SurfaceCard } from '@/components/dashboard/primitives'

export type FeatureTraceState = 'recovered' | 'in_progress' | 'traced' | 'not_started'

export type FeatureTraceItem = {
  id: string
  name: string
  description: string | null
  category: string
  relevantStacks: string[]
  state: FeatureTraceState
}

const CATEGORY_LABEL: Record<string, string> = {
  auth: 'Authentication',
  content: 'Content',
  navigation: 'Navigation',
  settings: 'Settings',
  social: 'Social',
  other: 'Other',
}

const CATEGORY_ORDER = ['auth', 'content', 'navigation', 'settings', 'social', 'other']

const STATE_COPY: Record<FeatureTraceState, { label: string; tone: 'default' | 'brand' | 'hint' | 'success'; cta: string }> = {
  recovered: { label: 'Recovered', tone: 'success', cta: 'View trace' },
  in_progress: { label: 'In progress', tone: 'hint', cta: 'Continue trace' },
  traced: { label: 'Traced', tone: 'brand', cta: 'View trace' },
  not_started: { label: 'Not started', tone: 'default', cta: 'Start trace' },
}

const STATE_ORDER: Record<FeatureTraceState, number> = {
  in_progress: 0,
  not_started: 1,
  traced: 2,
  recovered: 3,
}

export function FeatureTraceList({
  projectId,
  items,
}: {
  projectId: string
  items: FeatureTraceItem[]
}) {
  const byCategory = new Map<string, FeatureTraceItem[]>()

  for (const item of items) {
    const category = item.category || 'other'
    const current = byCategory.get(category) ?? []
    current.push(item)
    byCategory.set(category, current)
  }

  const categories = CATEGORY_ORDER.filter((category) => (byCategory.get(category)?.length ?? 0) > 0)

  return (
    <SurfaceCard className="h-full">
      <SectionHeader
        title="Continue tracing"
        description="Start with the next unfinished feature. Trace the feature, then explain it in your own words."
      />

      {items.length === 0 ? (
        <p className="quiet-meta">No features found yet.</p>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => {
            const rows = [...(byCategory.get(category) ?? [])].sort((left, right) => {
              return STATE_ORDER[left.state] - STATE_ORDER[right.state] || left.name.localeCompare(right.name)
            })

            return (
              <div key={category} className="space-y-3">
                <div className="border-b quiet-divider pb-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--app-subtle)]">
                    {CATEGORY_LABEL[category] ?? category}
                  </p>
                </div>

                <div className="space-y-3">
                  {rows.map((item) => {
                    const copy = STATE_COPY[item.state]

                    return (
                      <div
                        key={item.id}
                        className="rounded-[18px] border border-[var(--app-border)] bg-white/78 px-4 py-4 transition hover:bg-white"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-base font-medium tracking-[-0.02em] text-[var(--app-text)]">{item.name}</p>
                              <StateBadge label={copy.label} tone={copy.tone} />
                            </div>
                            {item.description ? <p className="quiet-body mt-2 text-sm">{item.description}</p> : null}
                            {item.relevantStacks.length > 0 ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {item.relevantStacks.map((stack) => (
                                  <span
                                    key={stack}
                                    className="rounded-full border border-[var(--app-border)] bg-[var(--app-bg-elevated)] px-3 py-1 text-xs font-medium text-[var(--app-brand)]"
                                  >
                                    {stack}
                                  </span>
                                ))}
                              </div>
                            ) : null}
                          </div>

                          <Link
                            href={`/projects/${projectId}/trace/${item.id}`}
                            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-full bg-[var(--app-brand)] px-4 text-sm font-medium text-white transition hover:bg-[var(--app-brand)]/92"
                          >
                            {copy.cta}
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SurfaceCard>
  )
}
