'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLinks() {
  const pathname = usePathname()

  const links = [
    { href: '/', label: 'Home' },
    { href: '/projects', label: 'Projects' },
    { href: '/progress', label: 'Progress' },
  ]

  return (
    <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {links.map(({ href, label }) => {
        const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            style={{
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              color: isActive ? '#1d6187' : '#6b7280',
              textDecoration: 'none',
              padding: '5px 10px',
              borderRadius: '6px',
              background: isActive ? '#e2eef5' : 'transparent',
              transition: 'color 0.1s, background 0.1s',
            }}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
