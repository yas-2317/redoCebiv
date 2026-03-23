import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getProjectProgress } from '@/lib/progress/service'
import { listProjectRecoveryEvents, type RecoveryEventType } from '@/lib/recovery-events/service'
import type { ChallengeDifficulty } from '@/lib/challenges/types'
import { ProjectHeader } from '@/components/project/ProjectHeader'
import { ProjectRecoveryCard } from '@/components/project/ProjectRecoveryCard'
import { FeatureTraceList, type FeatureTraceItem, type FeatureTraceState } from '@/components/project/FeatureTraceList'
import { ChallengeList, type ChallengeState, type ProjectChallengeItem } from '@/components/project/ChallengeList'
import { LearningPathCard } from '@/components/project/LearningPathCard'
import { RecoveryActivityList } from '@/components/project/RecoveryActivityList'
import type { ActivityItem } from '@/components/dashboard/primitives'

type ChallengeGrade = 'self' | 'with_hint' | 'missed'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('id, name, status, stack, file_count, created_at, zip_hash')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()
  if (project.status !== 'ready') redirect(`/projects/${id}/analyzing`)

  const projectProgress = await getProjectProgress(user.id, id)
  if (!projectProgress) {
    throw new Error('PROJECT_PROGRESS_NOT_FOUND')
  }

  const [{ data: usecases }, { data: challenges }, recoveryEvents] = await Promise.all([
    supabase
      .from('usecases')
      .select('id, name, description, related_file_paths, display_order, category, relevant_stacks')
      .eq('project_id', id)
      .order('display_order'),
    supabase
      .from('challenges')
      .select('id, title, type, difficulty, usecase_id, usecases(name, category)')
      .eq('project_id', id)
      .eq('status', 'active')
      .order('difficulty'),
    listProjectRecoveryEvents({
      supabase,
      userId: user.id,
      projectId: id,
      limit: 8,
    }),
  ])

  const tracedIds = new Set(projectProgress.tracedUsecaseIds ?? [])
  const submissionByChallenge = projectProgress.challengeGradesById ?? {}
  const challengeGradesByUsecase = new Map<string, ChallengeGrade[]>()

  for (const challenge of challenges ?? []) {
    if (!challenge.usecase_id) continue
    const grade = submissionByChallenge[challenge.id]
    if (!grade) continue
    const current = challengeGradesByUsecase.get(challenge.usecase_id) ?? []
    current.push(grade)
    challengeGradesByUsecase.set(challenge.usecase_id, current)
  }

  const featureItems: FeatureTraceItem[] = (usecases ?? []).map((usecase) => {
    const state = getFeatureTraceState({
      traced: tracedIds.has(usecase.id),
      grades: challengeGradesByUsecase.get(usecase.id) ?? [],
    })

    return {
      id: usecase.id,
      name: usecase.name,
      description: usecase.description,
      category: usecase.category ?? 'other',
      relevantStacks: (usecase.relevant_stacks as string[] | null) ?? [],
      state,
    }
  })

  const challengeItems: ProjectChallengeItem[] = (challenges ?? []).map((challenge) => ({
    id: challenge.id,
    title: challenge.title,
    difficulty: challenge.difficulty as ChallengeDifficulty,
    relatedFeatureName: (challenge.usecases as unknown as { name: string } | null)?.name ?? null,
    relatedCategory: (challenge.usecases as unknown as { category: string } | null)?.category ?? null,
    state: getChallengeState(submissionByChallenge[challenge.id]),
  }))

  const momentum = getMomentumLabel({
    recentEventCount: recoveryEvents.length,
    recoveredThisWeek: recoveryEvents.filter((event) => event.event_type === 'challenge_self_solved').length,
    tracedThisWeek: recoveryEvents.filter((event) => event.event_type === 'trace_generated').length,
    gotItBackCount: projectProgress.selfSolvedChallenges,
  })

  const activityItems: ActivityItem[] = recoveryEvents.map((event) => ({
    ...getActivityPresentation(event.event_type),
    title: event.title,
    projectName: event.detail || undefined,
    timestamp: formatRelative(event.created_at),
  }))

  return (
    <div className="quiet-grid gap-8">
      <ProjectHeader
        projectId={id}
        title={project.name}
        stack={project.stack ?? []}
        fileCount={project.file_count}
        description="Understand the codebase by tracing key features and validating your understanding with challenges."
      />

      <ProjectRecoveryCard
        tracedCount={projectProgress.traceCount}
        totalUsecases={projectProgress.usecaseCount}
        solvedCount={projectProgress.solvedCount}
        totalChallenges={projectProgress.challengeCount}
        gotItBackCount={projectProgress.selfSolvedChallenges}
        momentumLabel={momentum.label}
        momentumNote={momentum.note}
      />

      <LearningPathCard />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.92fr)]">
        <FeatureTraceList projectId={id} items={featureItems} />
        <ChallengeList projectId={id} items={challengeItems} />
      </div>

      <RecoveryActivityList items={activityItems} />
    </div>
  )
}

function getFeatureTraceState({
  traced,
  grades,
}: {
  traced: boolean
  grades: ChallengeGrade[]
}): FeatureTraceState {
  if (grades.includes('self')) return 'recovered'
  if (traced && grades.some((grade) => grade === 'with_hint' || grade === 'missed')) return 'in_progress'
  if (traced) return 'traced'
  return 'not_started'
}

function getChallengeState(grade: ChallengeGrade | undefined): ChallengeState {
  if (!grade) return 'not_started'
  return grade
}

function getMomentumLabel({
  recentEventCount,
  recoveredThisWeek,
  tracedThisWeek,
  gotItBackCount,
}: {
  recentEventCount: number
  recoveredThisWeek: number
  tracedThisWeek: number
  gotItBackCount: number
}) {
  if (recoveredThisWeek > 0 && recentEventCount >= 3) {
    return {
      label: 'steady',
      note: 'Recent work shows a steady hand. You are turning explanation into ownership.',
    }
  }

  if (tracedThisWeek > 0 || recentEventCount >= 2) {
    return {
      label: 'building',
      note: 'Momentum is building here. The next unfinished feature is a good place to continue.',
    }
  }

  if (gotItBackCount > 0) {
    return {
      label: 'quiet',
      note: 'You already have some ground back. A fresh trace will help you regain the thread.',
    }
  }

  return {
    label: 'just beginning',
    note: 'This project is still early in recovery. Start with the clearest unfinished feature.',
  }
}

function getActivityPresentation(eventType: RecoveryEventType) {
  switch (eventType) {
    case 'trace_generated':
      return { badgeLabel: 'Traced', badgeTone: 'trace' as const }
    case 'challenge_self_solved':
      return { badgeLabel: 'Recovered', badgeTone: 'recovered' as const }
    case 'challenge_solved_with_hint':
      return { badgeLabel: 'Challenged', badgeTone: 'challenge' as const }
    case 'challenge_missed':
      return { badgeLabel: 'Challenged', badgeTone: 'challenge' as const }
  }
}

function formatRelative(iso: string): string {
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
