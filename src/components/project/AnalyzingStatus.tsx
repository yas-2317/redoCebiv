'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  projectId: string
}

export default function AnalyzingStatus({ projectId }: Props) {
  const router = useRouter()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/projects/${projectId}`)
      if (!res.ok) return
      const project = await res.json()

      if (project.status === 'ready') {
        clearInterval(interval)
        router.push(`/projects/${projectId}`)
      }
      if (project.status === 'error') {
        clearInterval(interval)
        setErrorMessage(project.error_message ?? 'Analysis failed')
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [projectId, router])

  if (errorMessage) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <p style={{ color: '#dc2626', fontSize: '14px' }}>{errorMessage}</p>
        <a href="/projects/new" style={{ fontSize: '13px', color: '#6b7280', textDecoration: 'underline' }}>
          Try again
        </a>
      </div>
    )
  }

  const steps = [
    { label: 'Extracting ZIP...', threshold: 0 },
    { label: 'Saving files...', threshold: 5 },
    { label: 'AI is reading your code...', threshold: 15 },
    { label: 'Extracting use cases...', threshold: 30 },
    { label: 'Generating challenges...', threshold: 50 },
    { label: 'Almost done...', threshold: 70 },
  ]

  const currentStep = steps.filter(s => elapsed >= s.threshold).at(-1)?.label ?? steps[0].label

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .analyzing-spinner { animation: spin 0.8s linear infinite; }
      `}</style>
      <div
        className="analyzing-spinner"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid #e5e7eb',
          borderTopColor: '#1d6187',
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>{currentStep}</p>
        <p style={{ fontSize: '12px', color: '#9ca3af' }}>{elapsed}s elapsed</p>
      </div>
      <p style={{ fontSize: '11px', color: '#d1d5db' }}>Usually completes in 30–60 seconds</p>
    </div>
  )
}
