import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateExplanation } from '@/lib/anthropic/grade'

interface SubmitBody {
  selectedFiles: string[]
  answerText: string
  usedHint: boolean
  selectedIndex?: number
}

interface ChallengeAnswer {
  correct_files: string[]
  correct_code: string
  explanation: string
  change_type: string
  related_examples: string[]
  choices?: string[]
  correct_index?: number
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; challengeId: string }> }
) {
  const { id: projectId, challengeId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single()

  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Load challenge with answer
  const { data: challenge } = await supabase
    .from('challenges')
    .select('id, title, answer, difficulty, format')
    .eq('id', challengeId)
    .eq('project_id', projectId)
    .single()

  if (!challenge) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body: SubmitBody = await req.json()
  const { selectedFiles, answerText, usedHint, selectedIndex } = body
  const answer = challenge.answer as ChallengeAnswer
  const format = (challenge.format ?? 'file_selection') as string

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
      selectedFiles,
      correctFiles: answer.correct_files,
      answerText,
      correctCode: answer.correct_code,
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

  return NextResponse.json({
    grade,
    explanation,
    correctFiles: answer.correct_files,
    correctCode: answer.correct_code,
    changeType: answer.change_type,
    relatedExamples: answer.related_examples ?? [],
  })
}
