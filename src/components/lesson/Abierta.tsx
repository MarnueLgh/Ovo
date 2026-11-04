'use client'

import { useId, useRef, useState } from 'react'
import { gradeAbierta } from '@/lib/exercises/grade'
import type { Abierta as Payload } from '@/lib/exercises/types'
import { CheckBar, type ExerciseProps } from './CheckBar'

export function Abierta({ payload: p, source, onResult, onContinue, saving, note }: ExerciseProps<Payload>) {
  const [text, setText] = useState('')
  const [compared, setCompared] = useState<false | 'kb' | 'ptr'>(false)
  const [marks, setMarks] = useState<boolean[]>(() => p.keyPoints.map(() => false))
  const [result, setResult] = useState<ReturnType<typeof gradeAbierta> | null>(null)
  const checked = useRef(false)
  const areaId = useId()

  function check() {
    if (checked.current) return
    checked.current = true
    const r = gradeAbierta(p.keyPoints.length, marks.filter(Boolean).length)
    setResult(r) // la retroalimentación sale antes de guardar
    onResult(r)
  }

  const got = marks.filter(Boolean).length
  return (
    <>
      <span className="kind">✍️ Respuesta abierta</span>
      <h1>{p.question}</h1>
      <label className="sr-lbl" htmlFor={areaId}>Tu respuesta</label>
      <textarea id={areaId} className="area" rows={4} value={text} readOnly={!!compared} onChange={(e) => setText(e.target.value)} placeholder="Escribe con tus palabras" />

      {compared && (
        <section className={`model${compared === 'kb' ? ' nokb' : ''}`} aria-label="Respuesta modelo">
          <h2>Respuesta modelo</h2>
          <p>{p.modelAnswer}</p>
          <fieldset disabled={!!result}>
            <legend>Marca los que incluiste</legend>
            {p.keyPoints.map((k, j) => (
              <label key={j} className="kp">
                <input type="checkbox" checked={marks[j]} onChange={(e) => setMarks((m) => m.map((v, n) => (n === j ? e.target.checked : v)))} />
                <span>{k}</span>
              </label>
            ))}
          </fieldset>
          {source && <p className="src">Vuelve a leerlo en {source.file}, p. {source.page}{source.verified === false && ' · cita sin verificar'}</p>}
        </section>
      )}

      {!compared ? (
        <CheckBar sub={text.trim() ? '' : 'Escribe tu respuesta'} label="Comparar" disabled={!text.trim()} onClick={(kb) => setCompared(kb ? 'kb' : 'ptr')} />
      ) : !result ? (
        <CheckBar sub="Compara con la respuesta modelo" label="Comprobar" onClick={check} note={note} />
      ) : (
        <CheckBar
          tone={result.correct ? 'ok' : 'no'}
          title={result.correct ? '¡Excelente!' : got > 0 ? 'Vas bien' : 'Repásalo'}
          sub={`Incluiste ${got} de ${p.keyPoints.length}`}
          label="Continuar"
          disabled={saving}
          onClick={onContinue}
          note={note}
        />
      )}
    </>
  )
}
