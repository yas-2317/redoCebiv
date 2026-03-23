import Link from 'next/link'
import { ArrowRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PageIntro({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="quiet-eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="quiet-title">{title}</h1>
        {description ? <p className="quiet-body mt-4 max-w-2xl">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div>
        <h2 className="quiet-section-title">{title}</h2>
        {description ? <p className="quiet-body mt-2">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function SurfaceCard({
  className,
  children,
  strong = false,
}: {
  className?: string
  children: React.ReactNode
  strong?: boolean
}) {
  return (
    <section className={cn('quiet-card p-6 md:p-7', strong && 'quiet-card-strong', className)}>
      {children}
    </section>
  )
}

export function HeroCard({
  eyebrow,
  title,
  description,
  note,
  stats,
  primaryAction,
  secondaryAction,
  aside,
}: {
  eyebrow: string
  title: string
  description: string
  note?: string
  stats?: Array<{ label: string; value: string }>
  primaryAction?: { href: string; label: string }
  secondaryAction?: { href: string; label: string }
  aside?: React.ReactNode
}) {
  return (
    <SurfaceCard strong className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-y-8 left-0 w-1 rounded-full bg-[var(--app-brand)]/70" />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.9fr)] lg:items-center">
        <div>
          <p className="quiet-eyebrow">{eyebrow}</p>
          <h2 className="mt-4 text-[clamp(2rem,3vw,3.3rem)] leading-none font-semibold tracking-[-0.05em] text-[var(--app-text)]">
            {title}
          </h2>
          <p className="quiet-body mt-4 max-w-2xl text-[1.02rem]">{description}</p>
          {note ? <p className="mt-4 text-sm text-[var(--app-brand)]/85">{note}</p> : null}
          {stats?.length ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {stats.map((stat) => (
                <div key={stat.label} className="quiet-pill">
                  <span className="font-semibold text-[var(--app-text)]">{stat.value}</span>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-col gap-4 rounded-[22px] border border-[var(--app-border)] bg-white/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]">
          {primaryAction ? (
            <Link
              href={primaryAction.href}
              className="inline-flex h-11 items-center justify-between rounded-full bg-[var(--app-brand)] px-5 text-sm font-medium text-white transition hover:bg-[var(--app-brand)]/92"
            >
              {primaryAction.label}
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
          {secondaryAction ? (
            <Link
              href={secondaryAction.href}
              className="inline-flex h-11 items-center justify-between rounded-full border border-[var(--app-border-strong)] bg-white/80 px-5 text-sm font-medium text-[var(--app-text)] transition hover:bg-[var(--app-bg-elevated)]"
            >
              {secondaryAction.label}
              <ArrowRight className="size-4" />
            </Link>
          ) : null}
          {aside ? <div className="border-t quiet-divider pt-4">{aside}</div> : null}
        </div>
      </div>
    </SurfaceCard>
  )
}

export function MetricCard({
  label,
  helper,
  value,
  tone = 'default',
  prominent = false,
  footer,
}: {
  label: string
  helper?: string
  value: string | number
  tone?: 'default' | 'success' | 'hint' | 'missed'
  prominent?: boolean
  footer?: React.ReactNode
}) {
  const tones = {
    default: 'bg-white text-[var(--app-text)]',
    success: 'bg-[var(--app-success-soft)] text-[var(--app-success)]',
    hint: 'bg-[var(--app-hint-soft)] text-[var(--app-hint)]',
    missed: 'bg-[var(--app-missed-soft)] text-[var(--app-missed)]',
  } as const

  return (
    <SurfaceCard className={cn('flex h-full flex-col gap-4', prominent && 'md:p-8')}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[1.05rem] font-medium tracking-[-0.02em] text-[var(--app-text)]">{label}</p>
          {helper ? <p className="quiet-meta mt-2">{helper}</p> : null}
        </div>
        <div className={cn('shrink-0 rounded-[18px] px-4 py-3', tones[tone])}>
          <span className={cn('tracking-[-0.05em]', prominent ? 'text-5xl font-semibold' : 'text-[2.3rem] font-semibold')}>
            {value}
          </span>
        </div>
      </div>
      {footer ? <div className="mt-auto">{footer}</div> : null}
    </SurfaceCard>
  )
}

export function ProgressBarRow({
  label,
  helper,
  value,
  max,
  tone = 'brand',
}: {
  label: string
  helper?: string
  value: number
  max: number
  tone?: 'brand' | 'success' | 'hint' | 'missed'
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  const toneClass = {
    brand: 'bg-[var(--app-brand)]',
    success: 'bg-[var(--app-success)]',
    hint: 'bg-[var(--app-hint)]',
    missed: 'bg-[var(--app-missed)]',
  } as const

  return (
    <div className="space-y-2.5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-[var(--app-text)]">{label}</p>
          {helper ? <p className="quiet-meta mt-1">{helper}</p> : null}
        </div>
        <p className="text-sm text-[var(--app-muted)]">
          <span className="font-semibold text-[var(--app-text)]">{value}</span> / {max}
        </p>
      </div>
      <div className="quiet-progress-track">
        <div className={cn('quiet-progress-bar', toneClass[tone])} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function StateBadge({
  label,
  tone = 'default',
}: {
  label: string
  tone?: 'default' | 'brand' | 'success' | 'hint' | 'missed'
}) {
  const tones = {
    default: 'bg-[rgba(103,115,125,0.1)] text-[var(--app-muted)]',
    brand: 'bg-[var(--app-brand-soft)] text-[var(--app-brand)]',
    success: 'bg-[var(--app-success-soft)] text-[var(--app-success)]',
    hint: 'bg-[var(--app-hint-soft)] text-[var(--app-hint)]',
    missed: 'bg-[var(--app-missed-soft)] text-[var(--app-missed)]',
  } as const
  const dotTones = {
    default: 'bg-[var(--app-muted)]/60',
    brand: 'bg-[var(--app-brand)]',
    success: 'bg-[var(--app-success)]',
    hint: 'bg-[var(--app-hint)]',
    missed: 'bg-[var(--app-missed)]',
  } as const

  return (
    <span className={cn('quiet-status-badge', tones[tone])}>
      <span className={cn('quiet-status-dot', dotTones[tone])} />
      {label}
    </span>
  )
}

export function StatChip({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | number
}) {
  return (
    <div className="rounded-[20px] border border-[var(--app-border)] bg-white/75 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm text-[var(--app-muted)]">
        <Icon className="size-4 text-[var(--app-brand)]" />
        <span>{label}</span>
      </div>
      <p className="text-3xl font-semibold tracking-[-0.05em] text-[var(--app-text)]">{value}</p>
    </div>
  )
}

export type ActivityItem = {
  badgeLabel: string
  badgeTone: 'trace' | 'challenge' | 'recovered' | 'updated'
  title: string
  projectName?: string
  timestamp: string
}

export function ActivityList({
  items,
  empty,
}: {
  items: ActivityItem[]
  empty: React.ReactNode
}) {
  if (items.length === 0) {
    return <SurfaceCard>{empty}</SurfaceCard>
  }

  return (
    <SurfaceCard className="p-0">
      <div className="divide-y quiet-divider">
        {items.map((item, index) => (
          <div key={`${item.title}-${item.timestamp}-${index}`} className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="quiet-action-badge" data-tone={item.badgeTone}>
                {item.badgeLabel}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--app-text)]">{item.title}</p>
                {item.projectName ? <p className="quiet-meta mt-1 truncate">{item.projectName}</p> : null}
              </div>
            </div>
            <span className="quiet-meta shrink-0">{item.timestamp}</span>
          </div>
        ))}
      </div>
    </SurfaceCard>
  )
}
