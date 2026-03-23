'use client'

import { useState } from 'react'
import { ProposalCard } from './ProposalCard'
import { CREDIT_COSTS } from '@/lib/billing/config'

interface Candidate {
  file: string
  line: number
  codeSnippet: string
  reason: string
  changeType: string
}

interface ProposalResult {
  intent: string
  change_type: string
  difficulty: number
  candidates: Candidate[]
}

interface ChangeIntentFormProps {
  projectId: string
}

export function ChangeIntentForm({ projectId }: ChangeIntentFormProps) {
  const [intent, setIntent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ProposalResult | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!intent.trim() || loading) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch(`/api/projects/${projectId}/change-proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent }),
      })

      if (res.status === 402) {
        setError('Not enough charts to navigate.')
        return
      }
      if (!res.ok) {
        setError('An error occurred. Please try again.')
        return
      }

      const data = await res.json() as ProposalResult
      setResult(data)
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          What do you want to change?
        </label>
        <fieldset disabled={loading} style={{ all: 'unset', display: 'contents' }}>
          <textarea
            value={intent}
            onChange={e => setIntent(e.target.value)}
            placeholder="e.g. Disable the add button when the input is empty"
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">−{CREDIT_COSTS.change_proposal} charts</p>
            <button
              type="submit"
              disabled={!intent.trim() || loading}
              className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Analyzing…' : 'Find changes ▶'}
            </button>
          </div>
        </fieldset>
      </form>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {result && result.candidates.length === 0 && (
        <p style={{ fontSize: '13px', color: '#9ca3af' }}>
          No specific location found. Try rephrasing your intent more concretely.
        </p>
      )}

      {result && result.candidates.length > 0 && (
        <div className="border-t border-gray-100 pt-6">
          <h3 className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Change candidates
          </h3>
          <ProposalCard
            intent={result.intent}
            changeType={result.change_type}
            difficulty={result.difficulty}
            candidates={result.candidates}
          />
        </div>
      )}
    </div>
  )
}
