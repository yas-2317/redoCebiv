const DIFFICULTY_STARS: Record<number, string> = {
  1: '★☆☆',
  2: '★★☆',
  3: '★★★',
}

const CHANGE_TYPE_LABEL: Record<string, string> = {
  text: 'Text change',
  condition: 'Condition change',
  validation: 'Add validation',
  display: 'Display change',
}

interface Candidate {
  file: string
  line: number
  codeSnippet: string
  reason: string
  changeType: string
}

interface ProposalCardProps {
  intent: string
  changeType: string
  difficulty: number
  candidates: Candidate[]
}

export function ProposalCard({ intent, changeType, difficulty, candidates }: ProposalCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-blue-100 px-3 py-0.5 text-sm font-medium text-blue-700">
          {CHANGE_TYPE_LABEL[changeType] ?? changeType}
        </span>
        <span className="text-sm text-gray-500">
          Difficulty: {DIFFICULTY_STARS[difficulty] ?? '★☆☆'}
        </span>
      </div>

      <p className="text-sm text-gray-600">
        <span className="font-medium">Intent:</span> {intent}
      </p>

      {candidates.length === 0 ? (
        <p className="text-sm text-gray-400">No candidates found. Try describing your intent more specifically.</p>
      ) : (
        <div className="space-y-3">
          {candidates.map((c, i) => (
            <div key={i} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-sm font-medium text-gray-900">{c.file}</p>
                  {c.line > 0 && (
                    <p className="text-xs text-gray-400">{c.line}行目</p>
                  )}
                </div>
                <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {c.changeType}
                </span>
              </div>
              {c.codeSnippet && (
                <pre className="mb-2 overflow-x-auto rounded bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  {c.codeSnippet}
                </pre>
              )}
              <p className="text-sm text-gray-600">{c.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
