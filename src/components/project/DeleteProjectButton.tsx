'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this project? This cannot be undone.')) return
    setLoading(true)
    await fetch(`/api/projects/${projectId}`, { method: 'DELETE' })
    router.push('/projects')
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      style={{
        padding: '6px 14px',
        borderRadius: '7px',
        border: '1px solid #fca5a5',
        background: 'white',
        color: '#dc2626',
        fontSize: '13px',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2' }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'white' }}
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
