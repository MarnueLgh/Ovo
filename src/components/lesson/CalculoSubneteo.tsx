'use client'

import { useId, useRef, useState } from 'react'
import { explainSubnetting, generateSubnetting, gradeSubnetting, type SubnetProblem } from '@/lib/exercises/subnetting'
import { CheckBar, type ExerciseProps } from './CheckBar'

const FIELDS = [
  { k: 'prefix', label: 'Prefijo nuevo', ph: '/__' },
  { k: 'mask', label: 'Máscara', ph: '255.255.255.___' },
  { k: 'magic', label: 'Número mágico', ph: '__' },
  { k: 'hosts', label: 'Hosts útiles por subred', ph: '__' },
] as const
const COLS = ['Red', 'Primer host', 'Último host', 'Broadcast']
const emptyTop = () => ({ prefix: '', mask: '', magic: '', hosts: '' })
const emptyRows = () => Array.from({ length: 3 }, () => ['', '', '', ''])
const mk = () => generateSubnetting(Math.random)

export function CalculoSubneteo({ onResult, onContinue, saving, note }: ExerciseProps<unknown>) {
  const uid = useId()
  const [p, setP] = useState<SubnetProblem>(mk)
  const [top, setTop] = useState(emptyTop)
  const [rows, setRows] = useState(emptyRows)
  const [res, setRes] = useState<ReturnType<typeof gradeSubnetting> | null>(null)
  const [why, setWhy] = useState<{ open: boolean; kb: boolean }>({ open: false, kb: false })
  const checked = useRef(false)

  function check() {
    if (checked.current) return
    checked.current = true
    const r = gradeSubnetting(p.answer, { ...top, rows })
    setRes(r)
    onResult({ score: r.score, correct: r.correct === r.total })
  }

  function again() {
    checked.current = false
    setP(mk())
    setTop(emptyTop())
    setRows(emptyRows())
    setRes(null)
    setWhy({ open: false, kb: false })
  }

  const cls = (ok: boolean | undefined) => (res ? (ok ? ' ok' : ' no') : '')
  const empty = !Object.values(top).some((v) => v.trim()) && !rows.some((r) => r.some((v) => v.trim()))
  const perfect = !!res && res.correct === res.total
  const other = { label: 'Otro ejercicio', onClick: again }

  return (
    <>
      <span className="kind">🧮 Cálculo paso a paso · Subneteo</span>
      <h1>Divide <span className="ip">{p.network}</span> en {p.subnets} subredes</h1>
      <p className="lead">Llena cada campo. Cada ejercicio se genera al azar y la app calcula la respuesta, así que puedes practicar sin límite.</p>

      <div className="sn-grid">
        {FIELDS.map(({ k, label, ph }) => (
          <div key={k} className={`f${cls(res?.fields[k])}`}>
            <label htmlFor={`${uid}${k}`}>{label}</label>
            <input id={`${uid}${k}`} inputMode={k === 'mask' ? 'decimal' : 'numeric'} autoComplete="off" placeholder={ph} value={top[k]} readOnly={!!res}
              onChange={(e) => setTop({ ...top, [k]: e.target.value })} />
            {res && !res.fields[k] && <span className="fix">Era {p.answer[k]}</span>}
          </div>
        ))}
      </div>

      <div className="sn-scroll">
        <table>
          <thead><tr><th scope="col"><span className="sr">Subred</span></th>{COLS.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r}>
                <th scope="row" className="n">{r + 1}</th>
                {row.map((v, c) => {
                  const ok = res?.fields[`r${r}c${c}`]
                  return (
                    <td key={c} className={cls(ok).trim()}>
                      <input inputMode="decimal" autoComplete="off" aria-label={`Subred ${r + 1}, ${COLS[c].toLowerCase()}`} value={v} readOnly={!!res}
                        onChange={(e) => setRows(rows.map((rw, i) => (i === r ? rw.map((x, j) => (j === c ? e.target.value : x)) : rw)))} />
                      {res && !ok && <span className="fix">Era {p.answer.rows[r][c]}</span>}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {res && !perfect && why.open && (
        <section id="explain" className={`steps${why.kb ? ' nokb' : ''}`} aria-label="Así se resuelve">
          <h2>Así se resuelve</h2>
          <ol>{explainSubnetting(p).map((s) => <li key={s}>{s}</li>)}</ol>
        </section>
      )}

      {!res ? (
        <CheckBar sub="Llena los 16 campos" label="Comprobar" disabled={empty} onClick={check} other={other} note={note} />
      ) : (
        <CheckBar
          tone={perfect ? 'ok' : 'no'}
          title={perfect ? '¡Perfecto! 16 de 16' : `${res.correct} de ${res.total} correctos`}
          label="Continuar"
          disabled={saving}
          onClick={onContinue}
          other={other}
          why={perfect ? undefined : { open: why.open, onToggle: (kb) => setWhy((w) => ({ open: !w.open, kb })) }}
          note={note}
        />
      )}
    </>
  )
}
