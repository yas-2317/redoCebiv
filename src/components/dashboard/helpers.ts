export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 60) return `${Math.max(mins, 0)}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'No recent activity'

  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function getProjectState(args: {
  status: string
  traceCount: number
  usecaseCount: number
  challengeCount: number
  solvedCount: number
}) {
  const { status, traceCount, usecaseCount, challengeCount, solvedCount } = args

  if (status === 'error') {
    return { label: 'Needs attention', tone: 'missed' as const, summary: 'Something interrupted the analysis.' }
  }

  if (status === 'uploading' || status === 'analyzing') {
    return { label: 'Preparing', tone: 'hint' as const, summary: 'We are still unpacking the codebase.' }
  }

  if (traceCount === 0) {
    return { label: 'Needs new trace', tone: 'brand' as const, summary: 'Start a trace to rebuild context.' }
  }

  if (challengeCount > solvedCount) {
    return { label: 'Challenge pending', tone: 'hint' as const, summary: 'A check-in is waiting for you.' }
  }

  if (usecaseCount > 0 && traceCount >= usecaseCount && challengeCount > 0 && solvedCount > 0) {
    return { label: 'Recovered this week', tone: 'success' as const, summary: 'You already have traction here.' }
  }

  return { label: 'Ready to continue', tone: 'success' as const, summary: 'A calm place to pick back up.' }
}

export function getActivityMeta(grade?: string) {
  if (grade === 'self') {
    return { badgeLabel: 'Recovered', badgeTone: 'recovered' as const }
  }

  if (grade === 'with_hint' || grade === 'missed') {
    return { badgeLabel: 'Challenged', badgeTone: 'challenge' as const }
  }

  return { badgeLabel: 'Traced', badgeTone: 'trace' as const }
}
