'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Home' },
  { href: '/projects', label: 'Projects' },
  { href: '/progress', label: 'Progress' },
]

export default function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {links.map(({ href, label }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)

        return (
          <Link
            key={href}
            href={href}
            className={`rounded-full px-3 py-2 text-sm transition ${
              isActive
                ? 'bg-white text-[var(--app-brand)] shadow-[0_4px_12px_rgba(29,43,53,0.06)]'
                : 'text-[var(--app-muted)] hover:bg-white/70 hover:text-[var(--app-text)]'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
