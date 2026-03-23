import { createClient } from '@/lib/supabase/server'

type ServerSupabase = Awaited<ReturnType<typeof createClient>>

export type RecoveryEventType =
  | 'trace_generated'
  | 'challenge_self_solved'
  | 'challenge_solved_with_hint'
  | 'challenge_missed'

export type RecoveryEventRow = {
  id: string
  event_type: RecoveryEventType
  title: string
  detail: string
  created_at: string
  usecase_id: string | null
  challenge_id: string | null
}

export async function logRecoveryEvent(params: {
  supabase: ServerSupabase
  userId: string
  projectId: string
  usecaseId?: string | null
  challengeId?: string | null
  eventType: RecoveryEventType
  title: string
  detail?: string | null
}) {
  const { supabase, userId, projectId, usecaseId, challengeId, eventType, title, detail } = params

  const { error } = await supabase.from('recovery_events').insert({
    user_id: userId,
    project_id: projectId,
    usecase_id: usecaseId ?? null,
    challenge_id: challengeId ?? null,
    event_type: eventType,
    title,
    detail: detail ?? '',
  })

  if (error) {
    console.error('logRecoveryEvent: insert failed', error)
  }
}

export async function listProjectRecoveryEvents(params: {
  supabase: ServerSupabase
  userId: string
  projectId: string
  limit?: number
}) {
  const { supabase, userId, projectId, limit = 8 } = params

  const { data, error } = await supabase
    .from('recovery_events')
    .select('id, event_type, title, detail, created_at, usecase_id, challenge_id')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('listProjectRecoveryEvents: query failed', error)
    return [] as RecoveryEventRow[]
  }

  return (data ?? []) as RecoveryEventRow[]
}
