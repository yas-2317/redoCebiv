import { createClient } from '@/lib/supabase/server'

type ServerSupabase = Awaited<ReturnType<typeof createClient>>
type ProgressProjectRow = {
  id: string
  name: string
  status: string
  stack: string[] | null
  file_count: number | null
  created_at: string
  zip_hash: string | null
}

export async function getReadyProjectsForUser(supabase: ServerSupabase, userId: string) {
  return supabase
    .from('projects')
    .select('id, name, status, stack, file_count, created_at, zip_hash')
    .eq('user_id', userId)
    .eq('status', 'ready')
}

export async function getProjectByIdForUser(supabase: ServerSupabase, userId: string, projectId: string) {
  return supabase
    .from('projects')
    .select('id, name, status, stack, file_count, created_at, zip_hash')
    .eq('user_id', userId)
    .eq('id', projectId)
    .single()
}

export async function getUsecasesForProjects(supabase: ServerSupabase, projectIds: string[]) {
  if (projectIds.length === 0) return { data: [] as Array<{ id: string; project_id: string }>, error: null }
  return supabase
    .from('usecases')
    .select('id, project_id')
    .in('project_id', projectIds)
}

export async function getActiveChallengesForProjects(supabase: ServerSupabase, projectIds: string[]) {
  if (projectIds.length === 0) return { data: [] as Array<{ id: string; project_id: string }>, error: null }
  return supabase
    .from('challenges')
    .select('id, project_id')
    .in('project_id', projectIds)
    .eq('status', 'active')
}

export async function getSubmissionsForProjects(supabase: ServerSupabase, userId: string, projectIds: string[]) {
  if (projectIds.length === 0) {
    return { data: [] as Array<{ challenge_id: string; grade: 'self' | 'with_hint' | 'missed'; project_id: string }>, error: null }
  }
  return supabase
    .from('challenge_submissions')
    .select('challenge_id, grade, project_id')
    .eq('user_id', userId)
    .in('project_id', projectIds)
}

export async function getTraceProjectLinks(supabase: ServerSupabase, projects: ProgressProjectRow[]) {
  const hashToProjectId = new Map<string, string>()
  for (const project of projects) {
    if (project.zip_hash) hashToProjectId.set(project.zip_hash, project.id)
  }

  const zipHashes = [...hashToProjectId.keys()]
  if (zipHashes.length === 0) {
    return {
      data: [] as Array<{ usecase_id: string; project_id: string }>,
      error: null,
    }
  }

  const result = await supabase
    .from('traces')
    .select('usecase_id, project_zip_hash')
    .in('project_zip_hash', zipHashes)

  return {
    data: (result.data ?? [])
      .map(trace => ({
        usecase_id: trace.usecase_id,
        project_id: hashToProjectId.get(trace.project_zip_hash) ?? '',
      }))
      .filter(trace => trace.project_id),
    error: result.error,
  }
}

export async function getProjectProgressData(supabase: ServerSupabase, userId: string, projectId: string) {
  const { data: project } = await getProjectByIdForUser(supabase, userId, projectId)
  if (!project) return { data: null, error: null }

  const [{ data: usecases, error: usecasesError }, { data: challenges, error: challengesError }, { data: submissions, error: submissionsError }, { data: traces, error: tracesError }] =
    await Promise.all([
      supabase.from('usecases').select('id').eq('project_id', projectId),
      supabase.from('challenges').select('id').eq('project_id', projectId).eq('status', 'active'),
      supabase.from('challenge_submissions').select('challenge_id, grade').eq('user_id', userId).eq('project_id', projectId),
      project.zip_hash
        ? supabase.from('traces').select('usecase_id').eq('project_zip_hash', project.zip_hash)
        : Promise.resolve({ data: [] as Array<{ usecase_id: string }>, error: null }),
    ])

  return {
    data: {
      project,
      usecases: usecases ?? [],
      challenges: challenges ?? [],
      submissions: submissions ?? [],
      traces: traces ?? [],
    },
    error: usecasesError ?? challengesError ?? submissionsError ?? tracesError,
  }
}
