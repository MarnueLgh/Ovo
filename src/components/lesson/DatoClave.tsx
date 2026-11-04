import type { DatoClave as Payload } from '@/lib/exercises/types'
import { CheckBar, type ExerciseProps } from './CheckBar'

export function DatoClave({ payload: p, source, onContinue }: ExerciseProps<Payload>) {
  return (
    <>
      <span className="kind">💡 Dato clave</span>
      <h1>{p.title}</h1>
      <p className="lead">{p.lead}</p>
      <div className="vs">
        {[
          { c: p.left, bg: '#E3F1FD' },
          { c: p.right, bg: '#FFE9DD' },
        ].map(({ c, bg }) => (
          <div key={c.title} className="card" style={{ background: bg }}>
            <h2>{c.title}</h2>
            <ul>{c.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        ))}
      </div>
      <div className="trick">
        <span className="emo" aria-hidden="true">🧠</span>
        <div><b>{p.rule.headline}</b>{p.rule.text}</div>
      </div>
      {source && <p className="src">Fuente: {source.file}, p. {source.page}</p>}
      <CheckBar label="Entendido" onClick={onContinue} />
    </>
  )
}
