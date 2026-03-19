'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this project? This cannot be undone.')) return
    setLoading(true)
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Delete project"
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '6px',
        border: '1px solid #fca5a5',
        background: 'white',
        color: '#dc2626',
        fontSize: '14px',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: 1,
      }}
    >
      {loading ? '…' : '×'}
    </button>
  )
}
