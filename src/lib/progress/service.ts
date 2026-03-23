import { createClient } from '@/lib/supabase/server'
import { getPrimaryStack } from '@/lib/stacks/primary'
import {
  getActiveChallengesForProjects,
  getProjectProgressData,
  getReadyProjectsForUser,
  getSubmissionsForProjects,
  getTraceProjectLinks,
  getUsecasesForProjects,
} from './queries'
import type { ProgressSummary, ProjectProgressRow, StackProgressRow, SubmissionGrade, UserProgressData } from './types'

const GRADE_RANK: Record<SubmissionGrade, number> = {
  missed: 0,
  with_hint: 1,
  self: 2,
}

function finalizeSummary(summary: Omit<ProgressSummary, 'completionRate' | 'masteryRate' | 'unattemptedChallenges'>): ProgressSummary {
  const unattemptedChallenges = Math.max(0, summary.totalChallenges - summary.attemptedChallenges)
  const completionRate = summary.totalChallenges > 0
    ? Math.round((summary.attemptedChallenges / summary.totalChallenges) * 100)
    : 0
  const masteryRate = summary.totalChallenges > 0
    ? Math.round((summary.selfSolvedChallenges / summary.totalChallenges) * 100)
    : 0

  return {
    ...summary,
    unattemptedChallenges,
    completionRate,
    masteryRate,
  }
}

function summarizeChallengeGrades(bestGrades: Map<string, SubmissionGrade>) {
  let attemptedChallenges = 0
  let selfSolvedChallenges = 0
  let hintSolvedChallenges = 0
  let missedChallenges = 0

  for (const grade of bestGrades.values()) {
    attemptedChallenges++
    if (grade === 'self') selfSolvedChallenges++
    else if (grade === 'with_hint') hintSolvedChallenges++
    else missedChallenges++
  }

  return {
    attemptedChallenges,
    selfSolvedChallenges,
    hintSolvedChallenges,
    missedChallenges,
  }
}

function getBestGradeMap(rows: Array<{ challenge_id: string; grade: SubmissionGrade }>) {
  const best = new Map<string, SubmissionGrade>()

  for (const row of rows) {
    const current = best.get(row.challenge_id)
    if (!current || GRADE_RANK[row.grade] > GRADE_RANK[current]) {
      best.set(row.challenge_id, row.grade)
    }
  }

  return best
}

export async function getUserProgress(userId: string): Promise<UserProgressData> {
  const supabase = await createClient()
  const { data: projects } = await getReadyProjectsForUser(supabase, userId)
  const projectRowsBase = projects ?? []
  const projectIds = projectRowsBase.map(project => project.id)

  const [{ data: usecases }, { data: challenges }, { data: submissions }, { data: traces }] = await Promise.all([
    getUsecasesForProjects(supabase, projectIds),
    getActiveChallengesForProjects(supabase, projectIds),
    getSubmissionsForProjects(supabase, userId, projectIds),
    getTraceProjectLinks(supabase, projectRowsBase),
  ])

  const usecasesByProject = new Map<string, number>()
  for (const usecase of usecases ?? []) {
    usecasesByProject.set(usecase.project_id, (usecasesByProject.get(usecase.project_id) ?? 0) + 1)
  }

  const traceUsecaseIdsByProject = new Map<string, Set<string>>()
  for (const trace of traces ?? []) {
    const current = traceUsecaseIdsByProject.get(trace.project_id) ?? new Set<string>()
    current.add(trace.usecase_id)
    traceUsecaseIdsByProject.set(trace.project_id, current)
  }

  const challengesByProject = new Map<string, string[]>()
  for (const challenge of challenges ?? []) {
    const current = challengesByProject.get(challenge.project_id) ?? []
    current.push(challenge.id)
    challengesByProject.set(challenge.project_id, current)
  }

  const submissionRowsByProject = new Map<string, Array<{ challenge_id: string; grade: SubmissionGrade }>>()
  for (const submission of submissions ?? []) {
    const current = submissionRowsByProject.get(submission.project_id) ?? []
    current.push({ challenge_id: submission.challenge_id, grade: submission.grade })
    submissionRowsByProject.set(submission.project_id, current)
  }

  const projectRows: ProjectProgressRow[] = projectRowsBase.map(project => {
    const usecaseCount = usecasesByProject.get(project.id) ?? 0
    const traceCount = traceUsecaseIdsByProject.get(project.id)?.size ?? 0
    const challengeIds = challengesByProject.get(project.id) ?? []
    const bestGrades = getBestGradeMap(submissionRowsByProject.get(project.id) ?? [])
    const challengeSummary = summarizeChallengeGrades(bestGrades)
    const summary = finalizeSummary({
      totalProjects: 1,
      totalFeatures: usecaseCount,
      totalTraces: traceCount,
      totalChallenges: challengeIds.length,
      ...challengeSummary,
    })

    return {
      projectId: project.id,
      projectName: project.name,
      stack: project.stack ?? [],
      fileCount: project.file_count,
      createdAt: project.created_at,
      status: project.status,
      usecaseCount,
      traceCount,
      challengeCount: challengeIds.length,
      solvedCount: summary.selfSolvedChallenges + summary.hintSolvedChallenges,
      ...summary,
    }
  })

  const stackAccumulator = new Map<string, {
    totalFeatures: number
    totalTraces: number
    totalChallenges: number
    attemptedChallenges: number
    selfSolvedChallenges: number
    hintSolvedChallenges: number
    missedChallenges: number
  }>()
  for (const project of projectRows) {
    const stackLabel = getPrimaryStack(project.stack) ?? 'Other'
    const current = stackAccumulator.get(stackLabel) ?? {
      totalFeatures: 0,
      totalTraces: 0,
      totalChallenges: 0,
      attemptedChallenges: 0,
      selfSolvedChallenges: 0,
      hintSolvedChallenges: 0,
      missedChallenges: 0,
    }

    current.totalFeatures += project.usecaseCount
    current.totalTraces += project.traceCount
    current.totalChallenges += project.challengeCount
    current.attemptedChallenges += project.attemptedChallenges
    current.selfSolvedChallenges += project.selfSolvedChallenges
    current.hintSolvedChallenges += project.hintSolvedChallenges
    current.missedChallenges += project.missedChallenges
    stackAccumulator.set(stackLabel, current)
  }

  const stackRows: StackProgressRow[] = [...stackAccumulator.entries()].map(([stackLabel, value]) => {
    const summary = finalizeSummary({
      totalProjects: 0,
      ...value,
    })
    const stackSummary = {
      totalFeatures: summary.totalFeatures,
      totalTraces: summary.totalTraces,
      totalChallenges: summary.totalChallenges,
      attemptedChallenges: summary.attemptedChallenges,
      selfSolvedChallenges: summary.selfSolvedChallenges,
      hintSolvedChallenges: summary.hintSolvedChallenges,
      missedChallenges: summary.missedChallenges,
      unattemptedChallenges: summary.unattemptedChallenges,
      completionRate: summary.completionRate,
      masteryRate: summary.masteryRate,
    }

    return {
      stackLabel,
      ...stackSummary,
    }
  })

  const summary = finalizeSummary({
    totalProjects: projectRows.length,
    totalFeatures: projectRows.reduce((sum, project) => sum + project.usecaseCount, 0),
    totalTraces: projectRows.reduce((sum, project) => sum + project.traceCount, 0),
    totalChallenges: projectRows.reduce((sum, project) => sum + project.challengeCount, 0),
    attemptedChallenges: projectRows.reduce((sum, project) => sum + project.attemptedChallenges, 0),
    selfSolvedChallenges: projectRows.reduce((sum, project) => sum + project.selfSolvedChallenges, 0),
    hintSolvedChallenges: projectRows.reduce((sum, project) => sum + project.hintSolvedChallenges, 0),
    missedChallenges: projectRows.reduce((sum, project) => sum + project.missedChallenges, 0),
  })

  return { summary, projectRows, stackRows }
}

export async function getUserProgressSummary(userId: string): Promise<ProgressSummary> {
  const progress = await getUserProgress(userId)
  return progress.summary
}

export async function getProjectProgress(userId: string, projectId: string): Promise<ProjectProgressRow | null> {
  const supabase = await createClient()
  const result = await getProjectProgressData(supabase, userId, projectId)
  if (!result.data) return null

  const { project, usecases, challenges, submissions, traces } = result.data
  const bestGrades = getBestGradeMap(submissions)
  const challengeSummary = summarizeChallengeGrades(bestGrades)
  const tracedUsecaseIds = [...new Set(traces.map(trace => trace.usecase_id))]
  const summary = finalizeSummary({
    totalProjects: 1,
    totalFeatures: usecases.length,
    totalTraces: tracedUsecaseIds.length,
    totalChallenges: challenges.length,
    ...challengeSummary,
  })

  return {
    projectId: project.id,
    projectName: project.name,
    stack: project.stack ?? [],
    fileCount: project.file_count,
    createdAt: project.created_at,
    status: project.status,
    usecaseCount: usecases.length,
    traceCount: tracedUsecaseIds.length,
    challengeCount: challenges.length,
    solvedCount: summary.selfSolvedChallenges + summary.hintSolvedChallenges,
    tracedUsecaseIds,
    challengeGradesById: Object.fromEntries(bestGrades.entries()),
    ...summary,
  }
}
