import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DeleteProjectButton } from './DeleteProjectButton'
import { ProgressBarRow, StateBadge } from '@/components/dashboard/primitives'
import { formatDate, getProjectState } from '@/components/dashboard/helpers'

interface Props {
  id: string
  name: string
  status: string
  stack: string[]
  fileCount: number | null
  createdAt: string
  lastActivityAt?: string | null
  traceCount?: number
  usecaseCount?: number
  solvedCount?: number
  challengeCount?: number
}

export default function ProjectCard({
  id,
  name,
  status,
  stack,
  fileCount,
  createdAt,
  lastActivityAt,
  traceCount = 0,
  usecaseCount = 0,
  solvedCount = 0,
  challengeCount = 0,
}: Props) {
  const href = status === 'ready' ? `/projects/${id}` : `/projects/${id}/analyzing`
  const state = getProjectState({
    status,
    traceCount,
    usecaseCount,
    challengeCount,
    solvedCount,
  })

  const hasTraces = usecaseCount > 0
  const hasChallenges = challengeCount > 0

  return (
    <div className="project-card-wrapper relative h-full">
      <Link href={href} className="project-card-link flex h-full">
        <article className="project-card quiet-card flex w-full flex-col rounded-[24px] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-xl font-semibold tracking-[-0.03em] text-[var(--app-text)]">{name}</p>
              <p className="quiet-body mt-2 text-sm">{state.summary}</p>
            </div>
            <StateBadge label={state.label} tone={state.tone} />
          </div>

          {stack.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {stack.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[var(--app-border)] bg-white/80 px-3 py-1 text-xs font-medium text-[var(--app-brand)]"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[var(--app-muted)]">
            <span>Last active: {formatDate(lastActivityAt ?? createdAt)}</span>
            {fileCount != null ? <span>{fileCount} files</span> : null}
          </div>

          <div className="mt-6 space-y-4 border-t quiet-divider pt-5">
            {hasTraces ? (
              <ProgressBarRow
                label="Trace progress"
                helper="Follow the code path"
                value={traceCount}
                max={usecaseCount}
                tone="brand"
              />
            ) : (
              <p className="quiet-meta">A trace will appear once the analysis has settled.</p>
            )}

            {hasChallenges ? (
              <ProgressBarRow
                label="Challenge progress"
                helper="Check your understanding"
                value={solvedCount}
                max={challengeCount}
                tone={solvedCount > 0 ? 'success' : 'hint'}
              />
            ) : (
              <p className="quiet-meta">Challenges unlock after you map a feature clearly enough.</p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between border-t quiet-divider pt-5">
            <div>
              <p className="quiet-meta">Got it back</p>
              <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[var(--app-text)]">{solvedCount}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--app-brand)] px-4 py-2 text-sm font-medium text-white">
              Open project
              <ArrowRight className="size-4" />
            </span>
          </div>
        </article>
      </Link>

      <div className="card-delete-btn">
        <DeleteProjectButton projectId={id} />
      </div>
    </div>
  )
}
