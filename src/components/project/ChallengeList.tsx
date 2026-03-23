import Link from 'next/link'
import { RotateCcw, Sparkles } from 'lucide-react'
import type { ChallengeDifficulty } from '@/lib/challenges/types'
import { SectionHeader, StateBadge, SurfaceCard } from '@/components/dashboard/primitives'

export type ChallengeState = 'not_started' | 'self' | 'with_hint' | 'missed'

export type ProjectChallengeItem = {
  id: string
  title: string
  difficulty: ChallengeDifficulty
  relatedFeatureName: string | null
  relatedCategory: string | null
  state: ChallengeState
}

const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  1: 'Light',
  2: 'Warm-up',
  3: 'Steady',
  4: 'Deep',
  5: 'Hard',
}

const DIFFICULTY_ICONS: Record<ChallengeDifficulty, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
}

const STATE_COPY: Record<ChallengeState, { label: string; tone: 'default' | 'success' | 'hint' | 'missed'; cta: string }> = {
  not_started: { label: 'Not started', tone: 'default', cta: 'Start' },
  self: { label: 'Solved on your own', tone: 'success', cta: 'Retry' },
  with_hint: { label: 'Solved with hint', tone: 'hint', cta: 'Retry' },
  missed: { label: 'Not yet', tone: 'missed', cta: 'Retry' },
}

const STATE_ORDER: Record<ChallengeState, number> = {
  not_started: 0,
  missed: 1,
  with_hint: 2,
  self: 3,
}

export function ChallengeList({
  projectId,
  items,
}: {
  projectId: string
  items: ProjectChallengeItem[]
}) {
  const sorted = [...items].sort((left, right) => {
    return STATE_ORDER[left.state] - STATE_ORDER[right.state] || left.difficulty - right.difficulty
  })

  return (
    <SurfaceCard className="h-full">
      <SectionHeader
        title="Challenges"
        description="Understanding checks. Challenges verify whether the code now feels like yours."
      />

      {sorted.length === 0 ? (
        <p className="quiet-meta">Challenges will appear once more features are traced.</p>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => {
            const copy = STATE_COPY[item.state]
            return (
              <div
                key={item.id}
                className="rounded-[18px] border border-[var(--app-border)] bg-white/78 px-4 py-4 transition hover:bg-white"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-medium tracking-[-0.02em] text-[var(--app-text)]">{item.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="quiet-pill">
                          <span className="flex items-center gap-0.5 text-[var(--app-hint)]" aria-hidden="true">
                            {Array.from({ length: DIFFICULTY_ICONS[item.difficulty] }).map((_, index) => (
                              <Sparkles key={`${item.id}-difficulty-${index}`} className="size-3.5" />
                            ))}
                          </span>
                          {DIFFICULTY_LABEL[item.difficulty]}
                        </span>
                        {item.relatedFeatureName ? (
                          <span className="quiet-pill">
                            {item.relatedFeatureName}
                          </span>
                        ) : item.relatedCategory ? (
                          <span className="quiet-pill">{item.relatedCategory}</span>
                        ) : null}
                      </div>
                    </div>
                    <StateBadge label={copy.label} tone={copy.tone} />
                  </div>

                  <div className="flex justify-end">
                    <Link
                      href={`/projects/${projectId}/challenge/${item.id}`}
                      className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium transition ${
                        item.state === 'not_started'
                          ? 'bg-[var(--app-brand)] text-white hover:bg-[var(--app-brand)]/92'
                          : 'border border-[var(--app-border-strong)] bg-white text-[var(--app-text)] hover:bg-[var(--app-bg-elevated)]'
                      }`}
                    >
                      {item.state === 'not_started' ? null : <RotateCcw className="size-4" />}
                      {copy.cta}
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SurfaceCard>
  )
}
