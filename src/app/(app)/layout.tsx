import { Suspense } from 'react'
import { NavPill } from '@/components/NavPill'
import './camino.css'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="shell">
      <Suspense fallback={null}>
        <NavPill />
      </Suspense>
      <div className="body">{children}</div>
    </div>
  )
}
