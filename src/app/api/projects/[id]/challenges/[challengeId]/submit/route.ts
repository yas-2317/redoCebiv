import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExplanation } from '@/lib/anthropic/grade'
import type { ChallengeAnswer, ChallengeFormat } from '@/lib/challenges/types'
import { logRecoveryEvent } from '@/lib/recovery-events/service'
import { enforceRateLimit, RATE_LIMITS, rateLimitExceededResponse } from '@/lib/security/rate-limit'
import { isUuid, validateChallengeSubmitInput } from '@/lib/security/validation'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; challengeId: string }> }
) {
  const { id: projectId, challengeId } = await params
  if (!isUuid(projectId) || !isUuid(challengeId)) {
    return NextResponse.json({ error: 'INVALID_ID' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const allowed = await enforceRateLimit({
    supabase,
    actorKey: user.id,
    ...RATE_LIMITS.challengeSubmit,
  })
  if (!allowed) return rateLimitExceededResponse()

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id, stack')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Load challenge with answer
  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, answer, difficulty, format, usecase_id, usecases(name)')
    .eq('id', challengeId)
    .eq('project_id', projectId)
    .single()

  if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'INVALID_JSON' }, { status: 400 })
  }

  const parsed = validateChallengeSubmitInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  const { selectedFiles, answerText, usedHint, selectedIndex } = parsed.value
  const answer = challenge.answer as ChallengeAnswer
  const format = (challenge.format ?? 'file_selection') as ChallengeFormat

  // Rule-based grade
  let grade: 'self' | 'with_hint' | 'missed'
  if (format === 'code_choice') {
    const correct = selectedIndex !== undefined && selectedIndex === answer.correct_index
    grade = correct ? (usedHint ? 'with_hint' : 'self') : 'missed'
  } else {
    const fileMatch = answer.correct_files.every(f => selectedFiles.includes(f))
    grade = fileMatch ? (usedHint ? 'with_hint' : 'self') : 'missed'
  }

  // Check for existing submission → reuse explanation only if grade matches
  const { data: existing } = await supabase
    .from('challenge_submissions')
    .select('id, explanation, grade')
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let explanation = ''
  if (existing?.explanation && existing.grade === grade) {
    explanation = existing.explanation
  }

  if (!explanation) {
    explanation = await generateExplanation({
      title: challenge.title,
      grade,
      format,
      selectedFiles,
      correctFiles: answer.correct_files,
      answerText,
      correctCode: answer.correct_code,
      selectedIndex,
      correctIndex: answer.correct_index,
      choices: answer.choices,
      currentCode: answer.current_code,
      projectStack: project.stack ?? [],
    })
  }

  // Save submission
  await supabase.from('challenge_submissions').insert({
    challenge_id: challengeId,
    project_id: projectId,
    user_id: user.id,
    selected_files: selectedFiles,
    answer_text: answerText,
    used_hint: usedHint,
    grade,
    explanation,
    selected_index: selectedIndex ?? null,
  })

  await logRecoveryEvent({
    supabase,
    userId: user.id,
    projectId,
    challengeId,
    usecaseId: challenge.usecase_id ?? null,
    eventType:
      grade === 'self'
        ? 'challenge_self_solved'
        : grade === 'with_hint'
          ? 'challenge_solved_with_hint'
          : 'challenge_missed',
    title: challenge.title,
    detail: ((challenge.usecases as unknown as { name: string } | null)?.name) ?? '',
  })

  return NextResponse.json({
    grade,
    explanation,
    correctFiles: answer.correct_files,
    correctCode: answer.correct_code,
    changeType: answer.change_type,
    relatedExamples: answer.related_examples ?? [],
  })
}
