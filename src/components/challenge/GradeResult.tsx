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
  self:      { icon: '✅', label: "You've got it back.",             color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  with_hint: { icon: '🟡', label: 'Almost — you needed a nudge.',    color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  missed:    { icon: '❌', label: "Not yet — here's how the AI built it.", color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

export function GradeResult({
  projectId, grade, explanation, correctFiles, correctCode, changeType, relatedExamples, onRetry,
}: GradeResultProps) {
  const cfg = GRADE_CONFIG[grade]

  const sectionStyle = {
    border: '1px solid #e5e7eb',
    borderRadius: '10px',
    background: 'white',
    padding: '16px 20px',
  }

  const labelStyle = {
    fontSize: '11px',
    fontWeight: 600 as const,
    color: '#9ca3af',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '8px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Grade banner */}
      <div style={{ border: `1px solid ${cfg.border}`, borderRadius: '10px', background: cfg.bg, padding: '14px 18px' }}>
        <p style={{ fontSize: '15px', fontWeight: 600, color: cfg.color }}>
          {cfg.icon} {cfg.label}
        </p>
      </div>

      {/* Correct files + code + change type */}
      <div style={sectionStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <p style={labelStyle}>Correct file{correctFiles.length > 1 ? 's' : ''}</p>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {correctFiles.map(f => (
                <li key={f} style={{ fontFamily: 'monospace', fontSize: '13px', color: '#111827' }}>{f}</li>
              ))}
            </ul>
          </div>

          {correctCode && (
            <div>
              <p style={labelStyle}>Correct change</p>
              <code style={{ display: 'block', background: '#f3f4f6', borderRadius: '6px', padding: '10px 14px', fontSize: '13px', color: '#111827' }}>
                {correctCode}
              </code>
            </div>
          )}

          {changeType && (
            <div>
              <p style={labelStyle}>Change type</p>
              <p style={{ fontSize: '13px', color: '#374151' }}>{changeType}</p>
            </div>
          )}
        </div>
      </div>

      {/* Explanation */}
      {explanation && (
        <div style={{ ...sectionStyle, background: '#f9fafb' }}>
          <p style={labelStyle}>Explanation</p>
          <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.7' }}>{explanation}</p>
        </div>
      )}

      {/* Related examples */}
      {relatedExamples.length > 0 && (
        <div style={sectionStyle}>
          <p style={labelStyle}>Similar patterns in this codebase</p>
          <ul style={{ paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {relatedExamples.map((ex, i) => (
              <li key={i} style={{ fontSize: '13px', color: '#6b7280' }}>{ex}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
        <button
          type="button"
          onClick={onRetry}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            background: 'white',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <Link
          href={`/projects/${projectId}`}
          style={{
            padding: '8px 18px',
            borderRadius: '8px',
            border: '1px solid #d1d5db',
            background: 'white',
            fontSize: '13px',
            fontWeight: 500,
            color: '#374151',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          ← Back to project
        </Link>
      </div>

    </div>
  )
}
