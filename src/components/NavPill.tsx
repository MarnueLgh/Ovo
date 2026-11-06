'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Foca } from './Foca'

// `desk`: solo en la píldora lateral; en celular Material se abre desde Ajustes para dejar 4 botones abajo.
const items = [
  { href: '/', label: 'Inicio', icon: '🏠', match: (p: string) => p === '/' },
  { href: '/camino', label: 'Camino', icon: '🗺️', match: (p: string) => p.startsWith('/materia') || p === '/camino' },
  { href: '/panel', label: 'Panel', icon: '📊', match: (p: string) => p.startsWith('/panel') },
  { href: '/material', label: 'Material', icon: '📚', match: (p: string) => p.startsWith('/material'), desk: true },
  { href: '/ajustes', label: 'Ajustes', icon: '⚙️', match: (p: string) => p.startsWith('/ajustes') },
]

export function NavPill() {
  const pathname = usePathname()
  // Recuerda la última materia para que "Camino" vuelva a ella (lo lee /camino en el servidor).
  useEffect(() => {
    const m = pathname.match(/^\/materia\/([^/]+)/)
    if (m) document.cookie = `ovo_materia=${m[1]}; path=/; max-age=31536000; samesite=lax`
  }, [pathname])

  return (
    <nav className="nav" aria-label="Principal">
      <Foca className="foca" />
      {items.map((it) => {
        const on = it.match(pathname)
        return (
          <Link key={it.href} href={it.href} aria-current={on ? 'page' : undefined} className={[on && 'on', it.desk && 'desk'].filter(Boolean).join(' ') || undefined}>
            <span className="ic" aria-hidden="true">{it.icon}</span>
            <span className="nl">{it.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
