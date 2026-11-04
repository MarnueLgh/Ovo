'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const items = [
  { href: '/', label: 'Camino', icon: '🗺️', match: (p: string) => p === '/' || p.startsWith('/materia') },
  { href: '/panel', label: 'Panel', icon: '📊', match: (p: string) => p.startsWith('/panel') },
  { href: '/material', label: 'Material', icon: '📚', match: (p: string) => p.startsWith('/material') },
  { href: '/ajustes', label: 'Ajustes', icon: '⚙️', match: (p: string) => p.startsWith('/ajustes') },
]

export function NavPill() {
  const pathname = usePathname()
  return (
    <nav className="nav" aria-label="Principal">
      <div className="egg" aria-hidden="true" />
      {items.map((it) => {
        const on = it.match(pathname)
        return (
          <Link key={it.href} href={it.href} aria-label={it.label} aria-current={on ? 'page' : undefined} className={on ? 'on' : undefined}>
            <span aria-hidden="true">{it.icon}</span>
          </Link>
        )
      })}
    </nav>
  )
}
