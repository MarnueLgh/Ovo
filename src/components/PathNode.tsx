import Link from 'next/link'
import type { NodeState } from '@/lib/path'

const zigzag = [-60, 0, 60, 0]

export function PathNode({ index, state, lessonId, title }: { index: number; state: NodeState; lessonId: string; title: string }) {
  const style = { left: zigzag[index % 4], animationDelay: `${index * 40}ms` }
  const status = 'bloqueada'
  return (
    <div className="step in" style={style}>
      {state === 'current' && <span className="bubble" aria-hidden="true">EMPEZAR</span>}
      {state === 'current' ? (
        <Link className="node n-now" href={`/leccion/${lessonId}`} aria-label={`Empezar lección: ${title}`}>★</Link>
      ) : state === 'done' ? (
        <Link className="node n-done" href={`/leccion/${lessonId}`} aria-label={`Repetir lección: ${title}`}>✓</Link>
      ) : (
        <span className="node n-lock" aria-hidden="true">🔒</span>
      )}
      <span className="lbl">
        {title}
        {state === 'locked' && <span className="sr"> ({status})</span>}
      </span>
    </div>
  )
}
