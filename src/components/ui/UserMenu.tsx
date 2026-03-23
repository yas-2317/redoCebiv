'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UserMenu({ displayName }: { displayName: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
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
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--app-border)] bg-white/75 px-3 py-2 text-sm text-[var(--app-text)] transition hover:bg-white"
      >
        <span className="max-w-[12rem] truncate">{displayName}</span>
        <ChevronDown className="size-4 text-[var(--app-muted)]" />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 min-w-[180px] rounded-[18px] border border-[var(--app-border)] bg-white/96 p-2 shadow-[0_18px_40px_rgba(29,43,53,0.1)] backdrop-blur-md">
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block rounded-[12px] px-4 py-3 text-sm text-[var(--app-text)] transition hover:bg-[var(--app-bg-elevated)]"
          >
            Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="block w-full rounded-[12px] px-4 py-3 text-left text-sm text-[var(--app-text)] transition hover:bg-[var(--app-bg-elevated)]"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  )
}
