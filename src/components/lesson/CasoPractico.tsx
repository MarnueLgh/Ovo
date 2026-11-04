'use client'

import { useRef, useState } from 'react'
import { gradeCaso } from '@/lib/exercises/grade'
import type { CasoPractico as Payload } from '@/lib/exercises/types'
import { CheckBar, type ExerciseProps } from './CheckBar'

export function CasoPractico({ payload: p, source, onResult, onContinue, saving, note }: ExerciseProps<Payload>) {
  const [sel, setSel] = useState<number | null>(null)
  const [result, setResult] = useState<ReturnType<typeof gradeCaso> | null>(null)
  const [why, setWhy] = useState<{ open: boolean; kb: boolean }>({ open: false, kb: false })
  const checked = useRef(false)

  function check() {
    if (sel === null || checked.current) return
    checked.current = true
    const r = gradeCaso(p, sel)
    setResult(r) // la retroalimentación sale antes de guardar
    onResult({ score: r.score, correct: r.correct })
  }

  const right = p.options.find((o) => o.correct)!
  const chosen = sel === null ? null : p.options[sel]

  return (
    <>
      <span className="kind">🛠️ Caso práctico</span>
      <h1>{p.question}</h1>
      <p className="scene">{p.scene}</p>
      <div className="opts">
        {p.options.map((o, i) => {
          const cls = result ? (o.correct ? ' right' : i === sel ? ' wrong' : '') : i === sel ? ' sel' : ''
          return (
            <button key={o.text} type="button" className={`opt${cls}`} aria-pressed={i === sel} disabled={!!result} onClick={() => setSel(i)}>
              {o.text}
            </button>
          )
        })}
      </div>

      {result && !result.correct && why.open && (
        <section id="explain" className={`explain${why.kb ? ' nokb' : ''}`} aria-label="Por qué estuvo mal">
          <h2>¿Por qué no?</h2>
          <p>{result.whyWrong}</p>
          <p className="ans">✓ Respuesta correcta: <b>{right.text}.</b> {p.explanation}</p>
          {source && <p className="src">Vuelve a leerlo en {source.file}, p. {source.page}{source.verified === false && ' · cita sin verificar'}</p>}
        </section>
      )}

      {!result ? (
        <CheckBar sub={sel === null ? 'Elige una opción' : ''} label="Comprobar" disabled={sel === null} onClick={check} note={note} />
      ) : result.correct ? (
        <CheckBar tone="ok" title="¡Excelente!" sub={p.explanation} label="Continuar" disabled={saving} onClick={onContinue} note={note} />
      ) : (
        <CheckBar
          tone="no"
          title="Casi"
          sub={chosen ? `Elegiste: ${chosen.text}` : undefined}
          label="Continuar"
          disabled={saving}
          onClick={onContinue}
          why={{ open: why.open, onToggle: (kb) => setWhy((w) => ({ open: !w.open, kb })) }}
          note={note}
        />
      )}
    </>
  )
}
