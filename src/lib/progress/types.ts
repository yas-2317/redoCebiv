export type SubmissionGrade = 'self' | 'with_hint' | 'missed'

export interface ProgressSummary {
  totalProjects: number
  totalFeatures: number
  totalTraces: number
  totalChallenges: number
  attemptedChallenges: number
  selfSolvedChallenges: number
  hintSolvedChallenges: number
  missedChallenges: number
  unattemptedChallenges: number
  completionRate: number
  masteryRate: number
}

export interface ProjectProgressRow extends ProgressSummary {
  projectId: string
  projectName: string
  stack: string[]
  fileCount: number | null
  createdAt: string
  status: string
  usecaseCount: number
  traceCount: number
  challengeCount: number
  solvedCount: number
  tracedUsecaseIds?: string[]
  challengeGradesById?: Record<string, SubmissionGrade>
}

export interface StackProgressRow extends Omit<ProgressSummary, 'totalProjects'> {
  stackLabel: string
}

export interface UserProgressData {
  summary: ProgressSummary
  projectRows: ProjectProgressRow[]
  stackRows: StackProgressRow[]
}
