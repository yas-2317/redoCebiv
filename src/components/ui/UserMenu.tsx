'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UserMenu({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        {displayName} ▾
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            minWidth: '140px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            zIndex: 50,
          }}
        >
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Settings
          </Link>
          <div style={{ height: '1px', background: '#f3f4f6' }} />
          <button
            onClick={handleSignOut}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
