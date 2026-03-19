'use client'

import Link from 'next/link'

interface GradeResultProps {
  projectId: string
  grade: 'self' | 'with_hint' | 'missed'
  explanation: string
  correctFiles: string[]
  correctCode: string
  changeType: string
  relatedExamples: string[]
  onRetry: () => void
}

const GRADE_CONFIG = {
  self: {
    icon: '✅',
    label: "You've got it back.",
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
  },
  with_hint: {
    icon: '🟡',
    label: 'Almost — you needed a nudge.',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50 border-yellow-200',
  },
  missed: {
    icon: '❌',
    label: "Not yet — here's how the AI built it.",
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
  },
}

export function GradeResult({
  projectId,
  grade,
  explanation,
  correctFiles,
  correctCode,
  changeType,
  relatedExamples,
  onRetry,
}: GradeResultProps) {
  const config = GRADE_CONFIG[grade]

  return (
    <div className="space-y-4">
      <div className={`rounded-lg border p-4 ${config.bg}`}>
        <p className={`text-base font-semibold ${config.color}`}>
          {config.icon} {config.label}
        </p>
      </div>

      <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Correct file{correctFiles.length > 1 ? 's' : ''}
          </p>
          <ul className="mt-1 space-y-0.5">
            {correctFiles.map(f => (
              <li key={f} className="font-mono text-sm text-gray-800">{f}</li>
            ))}
          </ul>
        </div>

        {correctCode && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Correct change
            </p>
            <code className="mt-1 block rounded bg-gray-100 px-3 py-2 text-sm text-gray-800">
              {correctCode}
            </code>
          </div>
        )}

        {changeType && (
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Change type
            </p>
            <p className="mt-1 text-sm text-gray-700">{changeType}</p>
          </div>
        )}
      </div>

      {explanation && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Explanation</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{explanation}</p>
        </div>
      )}

      {relatedExamples.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Similar patterns in this codebase
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {relatedExamples.map((ex, i) => (
              <li key={i} className="text-sm text-gray-600">{ex}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Try again
        </button>
        <Link
          href={`/projects/${projectId}`}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          ← Back to project
        </Link>
      </div>
    </div>
  )
}
