'use client'

import { useState } from 'react'
import { FileTree } from './FileTree'
import { GradeResult } from './GradeResult'
import { ChoiceSelector } from './ChoiceSelector'

interface ChallengeAnswer {
  choices?: string[]
  correct_index?: number
  current_code?: string
}

interface Challenge {
  id: string
  title: string
  description: string
  type: string
  difficulty: number
  format: 'file_selection' | 'code_choice'
  hint: string | null
  answer: ChallengeAnswer
}

interface PreviousSubmission {
  grade: 'self' | 'with_hint' | 'missed'
  explanation: string
  selected_files: string[]
  answer_text: string
  used_hint: boolean
}

interface SubmitResult {
  grade: 'self' | 'with_hint' | 'missed'
  explanation: string
  correctFiles: string[]
  correctCode: string
  changeType: string
  relatedExamples: string[]
}

interface Props {
  projectId: string
  challenge: Challenge
  filePaths: string[]
  previousSubmission: PreviousSubmission | null
}

const DIFFICULTY_STARS: Record<number, string> = {
  1: '★☆☆☆☆',
  2: '★★☆☆☆',
  3: '★★★☆☆',
  4: '★★★★☆',
  5: '★★★★★',
}

const TYPE_LABEL: Record<string, string> = {
  text_change: 'Text change',
  condition: 'Condition change',
  validation: 'Validation',
  display: 'Display change',
}

export function ChallengeView({ projectId, challenge, filePaths, previousSubmission }: Props) {
  const isCodeChoice = challenge.format === 'code_choice'
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [answerText, setAnswerText] = useState('')
  const [hintVisible, setHintVisible] = useState(false)
  const [usedHint, setUsedHint] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const showHint = () => {
    setHintVisible(true)
    setUsedHint(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(
        `/api/projects/${projectId}/challenges/${challenge.id}/submit`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ selectedFiles, answerText, usedHint, selectedIndex }),
        }
      )

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Something went wrong')
        return
      }

      const data: SubmitResult = await res.json()
      setResult(data)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRetry = () => {
    setResult(null)
    setSelectedFiles([])
    setSelectedIndex(null)
    setAnswerText('')
    setHintVisible(false)
    setUsedHint(false)
    setError(null)
  }

  if (result) {
    return (
      <GradeResult
        projectId={projectId}
        grade={result.grade}
        explanation={result.explanation}
        correctFiles={result.correctFiles}
        correctCode={result.correctCode}
        changeType={result.changeType}
        relatedExamples={result.relatedExamples}
        onRetry={handleRetry}
      />
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Challenge header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-yellow-500">
            {DIFFICULTY_STARS[challenge.difficulty] ?? '★☆☆'}
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {TYPE_LABEL[challenge.type] ?? challenge.type}
          </span>
        </div>
        <p className="text-xs text-gray-400">You decoded it. Now make it yours —</p>
        <h1 className="text-xl font-bold text-gray-900">{challenge.title}</h1>
        <div className="rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
          {challenge.description}
        </div>
      </div>

      {/* Hint */}
      {challenge.hint && (
        <div>
          {hintVisible ? (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              <span className="font-medium">Hint: </span>{challenge.hint}
            </div>
          ) : (
            <button
              type="button"
              onClick={showHint}
              className="text-sm text-gray-400 underline hover:text-gray-600"
            >
              Show hint
            </button>
          )}
        </div>
      )}

      {/* Previous submission note */}
      {previousSubmission && !result && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-700">
          You&apos;ve attempted this challenge before. Your previous grade:{' '}
          <span className="font-medium capitalize">{previousSubmission.grade.replace('_', ' ')}</span>.
          Try again anytime.
        </div>
      )}

      {isCodeChoice ? (
        /* Code choice UI */
        <div className="space-y-3">
          {challenge.answer.current_code && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-widest text-gray-400">Current code</p>
              <pre className="overflow-x-auto rounded-lg bg-gray-950 px-4 py-3 text-xs leading-relaxed text-gray-100">
                <code>{challenge.answer.current_code}</code>
              </pre>
            </div>
          )}
          <label className="block text-sm font-medium text-gray-700">
            {challenge.difficulty === 4 ? 'Which code is the problem?' : 'Choose the correct fix:'}
          </label>
          <ChoiceSelector
            choices={challenge.answer.choices ?? []}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            disabled={submitting}
          />
        </div>
      ) : (
        /* File selection UI */
        <>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Which file(s) would you change?
              {selectedFiles.length > 0 && (
                <span className="ml-2 font-normal text-gray-400">
                  ({selectedFiles.length} selected)
                </span>
              )}
            </label>
            <FileTree
              paths={filePaths}
              selected={selectedFiles}
              onChange={setSelectedFiles}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
              What change would you make? <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="answer"
              value={answerText}
              onChange={e => setAnswerText(e.target.value)}
              placeholder="e.g. Add disabled={text.trim() === ''} to the button"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting || (isCodeChoice ? selectedIndex === null : selectedFiles.length === 0)}
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? 'Checking…' : 'Submit answer'}
      </button>
    </form>
  )
}
