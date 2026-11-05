'use client'

import { useState } from 'react'
import type { Comparacion, Concepto, Diagrama, Flashcard, Lista, Nodo } from '@/lib/exercises/types'
import './estudio.css'

export type StudyPayload = Concepto | Flashcard | Comparacion | Diagrama | Lista

const LABEL: Record<StudyPayload['kind'], string> = {
  concepto: '📘 Concepto', flashcard: '🃏 Flashcard', comparacion: '⚖️ Comparación', diagrama: '🧭 Diagrama', lista: '📝 Lista',
}
const LAYOUT: Record<Diagrama['layout'], string> = { proceso: 'Proceso', linea_tiempo: 'Línea de tiempo', ciclo: 'Ciclo', jerarquia: 'Jerarquía' }

/** Contenido de una tarjeta de estudio. `open`: modo apunte (flashcards con frente y reverso visibles). */
export function StudyBody({ payload: p, open = false, heading = 'h1' }: { payload: StudyPayload; open?: boolean; heading?: 'h1' | 'h2' }) {
  const H = heading
  return (
    <div className="study">
      <span className="kind">{LABEL[p.kind]}</span>
      {p.kind === 'concepto' && (
        <>
          <H>{p.title}</H>
          {p.body.split(/\n{2,}/).map((para, i) => <p key={i} className="body">{para}</p>)}
          {p.bullets && <ul className="bul">{p.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul>}
        </>
      )}
      {p.kind === 'flashcard' && <Flip p={p} open={open} H={H} />}
      {p.kind === 'comparacion' && (
        <>
          <H>{p.title}</H>
          <div className="cmp-scroll" tabIndex={0} role="region" aria-label={`Tabla: ${p.title}`}>
            <table className="cmp">
              <thead>
                <tr><td /> {p.columns.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr>
              </thead>
              <tbody>
                {p.rows.map((r, i) => (
                  <tr key={i}><th scope="row">{r.label}</th>{r.cells.map((c, j) => <td key={j}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {p.kind === 'diagrama' && (
        <>
          <H>{p.title}</H>
          <p className="layout">{LAYOUT[p.layout]}</p>
          {p.layout === 'jerarquia' ? (
            <ul className="tree">{p.nodes.map((n, i) => <TreeNode key={i} n={n} />)}</ul>
          ) : (
            <ol className={`flow ${p.layout}`}>
              {p.nodes.map((n, i) => (
                <li key={i}>
                  <span className="dot" aria-hidden="true">{p.layout === 'linea_tiempo' ? '' : i + 1}</span>
                  <div><b>{n.label}</b>{n.detail && <span>{n.detail}</span>}</div>
                </li>
              ))}
              {p.layout === 'ciclo' && <li className="back" aria-label="Vuelve al paso 1"><span className="dot" aria-hidden="true">↻</span><div>Vuelve al paso 1</div></li>}
            </ol>
          )}
        </>
      )}
      {p.kind === 'lista' && (
        <>
          <H>{p.title}</H>
          {p.intro && <p className="body">{p.intro}</p>}
          <ul className="items">{p.items.map((it, i) => <li key={i}>{it}</li>)}</ul>
        </>
      )}
    </div>
  )
}

function TreeNode({ n }: { n: Nodo }) {
  return (
    <li>
      <div className="tn"><b>{n.label}</b>{n.detail && <span>{n.detail}</span>}</div>
      {n.children && <ul>{n.children.map((c, i) => <TreeNode key={i} n={c} />)}</ul>}
    </li>
  )
}

function Flip({ p, open, H }: { p: Flashcard; open: boolean; H: 'h1' | 'h2' }) {
  const [flipped, setFlipped] = useState(false)
  if (open)
    return (
      <div className="fc-open">
        <H>{p.front}</H>
        <p className="body">{p.back}</p>
      </div>
    )
  return (
    <>
      <p className="hint">Piensa la respuesta y toca la tarjeta para voltearla.</p>
      <button type="button" className={`fc${flipped ? ' flipped' : ''}`} aria-pressed={flipped} onClick={() => setFlipped((f) => !f)}>
        <span className="face front" aria-hidden={flipped}><H>{p.front}</H></span>
        <span className="face back" aria-hidden={!flipped}><span className="body">{p.back}</span></span>
        <span className="sr">{flipped ? `Respuesta: ${p.back}` : 'Toca para ver la respuesta'}</span>
      </button>
    </>
  )
}
