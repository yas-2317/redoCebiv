'use client'

import Link from 'next/link'

interface Props {
  id: string
  name: string
  status: string
  stack: string[]
  fileCount: number | null
  createdAt: string
  traceCount?: number
  usecaseCount?: number
  solvedCount?: number
  challengeCount?: number
}

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  ready:     { label: 'Ready',      color: '#16a34a', dot: '#22c55e' },
  analyzing: { label: 'Analyzing',  color: '#d97706', dot: '#f59e0b' },
  uploading: { label: 'Uploading',  color: '#2563eb', dot: '#3b82f6' },
  error:     { label: 'Error',      color: '#dc2626', dot: '#ef4444' },
}

export default function ProjectCard({
  id, name, status, stack, fileCount, createdAt,
  traceCount, usecaseCount, solvedCount, challengeCount,
}: Props) {
  const isReady = status === 'ready'
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.analyzing
  const href = isReady ? `/projects/${id}` : `/projects/${id}/analyzing`

  return (
    <>
      <style>{`
        @keyframes shimmer-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.35; }
        }
        .card-shimmer { animation: shimmer-pulse 1.6s ease-in-out infinite; }
      `}</style>
      <Link href={href} style={{ display: 'flex', height: '100%' }}>
        <div
          style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            width: '100%',
            transition: 'box-shadow 0.15s, transform 0.15s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'
            ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
            ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
          }}
        >
          {/* Left status border */}
          <div style={{ width: '4px', flexShrink: 0, background: cfg.color }} />

          <div style={{ flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column' }}>
            {/* Title row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <p style={{ fontWeight: 600, fontSize: '14px', color: '#111827', lineHeight: '1.4' }}>
                {name}
              </p>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '11px',
                  fontWeight: 500,
                  color: cfg.color,
                  background: `${cfg.color}14`,
                  flexShrink: 0,
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                {cfg.label}
              </span>
            </div>

            {/* Stack badges */}
            {stack.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {stack.map(s => (
                  <span
                    key={s}
                    style={{
                      padding: '1px 7px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#1d6187',
                      background: '#e2eef5',
                      border: '1px solid #97bbd0',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            )}

            {/* Meta */}
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '6px' }}>
              {fileCount != null && `${fileCount} files · `}
              {new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>

            {/* Progress section — always shown for height consistency */}
            <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
              <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {isReady && usecaseCount != null && usecaseCount > 0 ? (
                  <>
                    <ProgressBar label="Traces" value={traceCount ?? 0} max={usecaseCount} />
                    {challengeCount != null && challengeCount > 0 && (
                      <ProgressBar label="Challenges" value={solvedCount ?? 0} max={challengeCount} />
                    )}
                  </>
                ) : (
                  <>
                    <ShimmerBar active={!isReady} />
                    <ShimmerBar active={!isReady} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </>
  )
}

function ProgressBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{value}/{max}</span>
      </div>
      <div style={{ height: '5px', borderRadius: '9999px', background: '#f3f4f6' }}>
        <div
          style={{
            height: '100%',
            borderRadius: '9999px',
            background: pct === 100 ? '#16a34a' : '#1d6187',
            width: `${pct}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  )
}

function ShimmerBar({ active }: { active: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div
          className={active ? 'card-shimmer' : undefined}
          style={{ height: '10px', width: '48px', borderRadius: '4px', background: '#f3f4f6' }}
        />
        <div
          className={active ? 'card-shimmer' : undefined}
          style={{ height: '10px', width: '28px', borderRadius: '4px', background: '#f3f4f6' }}
        />
      </div>
      <div style={{ height: '5px', borderRadius: '9999px', background: '#f3f4f6', overflow: 'hidden' }}>
        <div
          className={active ? 'card-shimmer' : undefined}
          style={{ height: '100%', width: '60%', background: '#e5e7eb', borderRadius: '9999px' }}
        />
      </div>
    </div>
  )
}
