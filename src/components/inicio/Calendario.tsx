'use client'

import { useState, useTransition } from 'react'
import { addExam, deleteExam } from '@/app/(app)/actions'
import { daysBetween, monthGrid, shiftMonth } from '@/lib/panel'

type Exam = { id: string; on: string; subjectId: string; unit: number | null }
type Subject = { id: string; name: string; color: string; emoji: string }
type Unit = { id: string; subjectId: string; number: number; title: string }
type Props = { today: string; exams: Exam[]; subjects: Subject[]; units: Unit[] }

const DOW = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const at = (d: string) => new Date(d + 'T00:00:00Z')
const monthName = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const longDay = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const shortMonth = new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: 'UTC' })
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function until(today: string, d: string) {
  const n = daysBetween(today, d)
  return n === 0 ? 'Hoy' : n === 1 ? 'Mañana' : `En ${n} días`
}

export function Calendario({ today, exams, subjects, units }: Props) {
  const [month, setMonth] = useState(today.slice(0, 7))
  const [sel, setSel] = useState<string | null>(null)
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? '')
  const [unitId, setUnitId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, start] = useTransition()

  const subj = new Map(subjects.map((s) => [s.id, s]))
  const byDay = new Map<string, Exam[]>()
  for (const e of exams) byDay.set(e.on, [...(byDay.get(e.on) ?? []), e])
  const upcoming = exams.filter((e) => e.on >= today).slice(0, 4)
  const subjUnits = units.filter((u) => u.subjectId === subjectId)
  const label = (e: Exam) => `${subj.get(e.subjectId)?.name ?? 'Materia'}${e.unit ? ` · Unidad ${e.unit}` : ''}`

  function save() {
    if (!sel || !subjectId) return
    setError(null)
    start(async () => {
      try {
        await addExam({ subjectId, unitId: unitId || null, on: sel })
      } catch {
        setError('No se pudo guardar el examen. Inténtalo de nuevo')
      }
    })
  }

  function remove(id: string) {
    setError(null)
    start(async () => {
      try {
        await deleteExam(id)
      } catch {
        setError('No se pudo borrar el examen. Inténtalo de nuevo')
      }
    })
  }

  const selExams = sel ? byDay.get(sel) ?? [] : []

  return (
    <div className="cal-wrap">
      <section className="cal in" style={{ animationDelay: '120ms' }} aria-labelledby="cal-h">
        <div className="cal-head">
          <h2 id="cal-h">{monthName.format(at(month + '-01'))}</h2>
          <div className="cal-nav">
            <button type="button" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Mes anterior">
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M10 3.5L5.5 8l4.5 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="Mes siguiente">
              <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6 3.5L10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </div>
        </div>
        <p className="cal-hint">Toca un día para agregar un examen.</p>
        <table className="cal-grid">
          <thead><tr>{DOW.map((d, i) => <th key={i} scope="col"><abbr title={['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'][i]}>{d}</abbr></th>)}</tr></thead>
          <tbody>
            {monthGrid(month).map((week, w) => (
              <tr key={w}>
                {week.map((d, i) => {
                  if (!d) return <td key={i} />
                  const es = byDay.get(d) ?? []
                  const cls = [d === today && 'hoy', d < today && 'past', d === sel && 'sel', es.length > 0 && 'has'].filter(Boolean).join(' ')
                  return (
                    <td key={i}>
                      <button
                        type="button"
                        className={cls || undefined}
                        aria-pressed={d === sel}
                        aria-label={`${longDay.format(at(d))}${d === today ? ', hoy' : ''}${es.length ? `, ${plural(es.length, 'examen', 'exámenes')}` : ''}`}
                        onClick={() => setSel(d === sel ? null : d)}
                        style={es[0] ? ({ '--c': subj.get(es[0].subjectId)?.color } as React.CSSProperties) : undefined}
                      >
                        {Number(d.slice(8))}
                        {es.length > 0 && <span className="dots" aria-hidden="true">{es.slice(0, 3).map((e) => <i key={e.id} style={{ background: subj.get(e.subjectId)?.color }} />)}</span>}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {sel && (
          <div className="cal-day">
            <h3>{longDay.format(at(sel))}</h3>
            {selExams.length > 0 && (
              <ul className="day-list">
                {selExams.map((e) => (
                  <li key={e.id}>
                    <span className="sw" style={{ background: subj.get(e.subjectId)?.color }} aria-hidden="true" />
                    <span className="dl-t">{label(e)}</span>
                    <button type="button" className="del" onClick={() => remove(e.id)} disabled={pending} aria-label={`Borrar examen de ${label(e)}`}>Borrar</button>
                  </li>
                ))}
              </ul>
            )}
            {subjects.length === 0 ? (
              <p className="cal-hint">Primero agrega una materia.</p>
            ) : (
              <form className="add" onSubmit={(ev) => { ev.preventDefault(); save() }}>
                <label>
                  <span>Materia</span>
                  <select value={subjectId} onChange={(ev) => { setSubjectId(ev.target.value); setUnitId('') }}>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </label>
                <label>
                  <span>Unidad</span>
                  <select value={unitId} onChange={(ev) => setUnitId(ev.target.value)}>
                    <option value="">Sin unidad</option>
                    {subjUnits.map((u) => <option key={u.id} value={u.id}>Unidad {u.number} · {u.title}</option>)}
                  </select>
                </label>
                <button type="submit" className="save" disabled={pending}>{pending ? 'Guardando…' : 'Agregar examen'}</button>
              </form>
            )}
          </div>
        )}
        {error && <p className="cal-err" role="alert">{error}</p>}
      </section>

      <section className="prox in" style={{ animationDelay: '160ms' }} aria-labelledby="prox-h">
        <h2 id="prox-h">Próximos exámenes</h2>
        {upcoming.length === 0 ? (
          <p className="prox-empty">Sin exámenes en el calendario. Toca el día de tu próximo examen para que ovo te lo recuerde aquí.</p>
        ) : (
          <ul className="prox-list">
            {upcoming.map((e) => (
              <li key={e.id} style={{ '--c': subj.get(e.subjectId)?.color } as React.CSSProperties}>
                <span className="badge" aria-hidden="true"><b>{Number(e.on.slice(8))}</b>{shortMonth.format(at(e.on)).replace('.', '')}</span>
                <span className="px-t">
                  <b>{label(e)}</b>
                  <small>{until(today, e.on)} · {longDay.format(at(e.on))}</small>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
