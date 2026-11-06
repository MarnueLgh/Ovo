import Link from 'next/link'
import type { NodeState } from '@/lib/path'
import { SkipStudy } from './SkipStudy'

const zigzag = [-60, 0, 60, 0]

type Props = { index: number; state: NodeState; lessonId: string; title: string; kind: string }

export function PathNode({ index, state, lessonId, title, kind }: Props) {
  const style = { left: zigzag[index % 4], animationDelay: `${index * 40}ms` }
  const study = kind === 'estudio'
  const verb = study ? 'Estudiar' : 'Empezar lección'
  // "Estudio ·" ya lo indica la etiqueta; quita el sufijo redundante del título.
  const shown = study ? title.replace(/:\s*estudio\s*$/i, '') : title
  return (
    <div className="step in" style={style}>
      {state === 'current' && <span className="bubble" aria-hidden="true">{study ? 'ESTUDIAR' : 'EMPEZAR'}</span>}
      {state === 'current' ? (
        <Link className={`node n-now${study ? ' n-study' : ''}`} href={`/leccion/${lessonId}`} aria-label={`${verb}: ${title}`}>{study ? '📖' : '★'}</Link>
      ) : state === 'done' ? (
        <Link className="node n-done" href={`/leccion/${lessonId}`} aria-label={`${study ? 'Volver a estudiar' : 'Repetir lección'}: ${title}`}>{study ? '📖' : '✓'}</Link>
      ) : (
        <span className="node n-lock" aria-hidden="true">🔒</span>
      )}
      <span className="lbl">
        {study && <span className="lbl-kind">Estudio · </span>}
        {shown}
        {state === 'locked' && <span className="sr"> (bloqueada)</span>}
      </span>
      {study && state !== 'locked' && (
        <Link className="apunte" href={`/leccion/${lessonId}/apunte`}>Ver apunte</Link>
      )}
      {study && state === 'current' && <SkipStudy lessonId={lessonId} title={title} />}
    </div>
  )
}
