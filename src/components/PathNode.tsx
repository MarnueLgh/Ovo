import Link from 'next/link'
import type { NodeState } from '@/lib/path'

const zigzag = [-60, 0, 60, 0]

export function PathNode({ index, state, lessonId, title }: { index: number; state: NodeState; lessonId: string; title: string }) {
  const style = { left: zigzag[index % 4], animationDelay: `${index * 40}ms` }
  const status = state === 'done' ? 'completada' : 'bloqueada'
  return (
    <div className="step in" style={style}>
      {state === 'current' && <span className="bubble" aria-hidden="true">EMPEZAR</span>}
      {state === 'current' ? (
        <Link className="node n-now" href={`/leccion/${lessonId}`} aria-label={`Empezar lección: ${title}`}>★</Link>
      ) : (
        <span className={`node ${state === 'done' ? 'n-done' : 'n-lock'}`} aria-hidden="true">{state === 'done' ? '✓' : '🔒'}</span>
      )}
      <span className="lbl">
        {title}
        {state !== 'current' && <span className="sr"> ({status})</span>}
      </span>
    </div>
  )
}
