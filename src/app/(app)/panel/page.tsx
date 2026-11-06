import { Suspense } from 'react'
import Link from 'next/link'
import { getPanel } from '@/lib/queries'
import { formatMinutes, heatLevel, yearGrid } from '@/lib/panel'
import { requireUser } from '@/lib/supabase/server'
import './panel.css'

const DOW = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
const dayFmt = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const label = (d: string) => dayFmt.format(new Date(d + 'T00:00:00Z'))
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const delay = (ms: number) => ({ animationDelay: `${ms}ms` })

async function Panel() {
  await requireUser()
  const p = await getPanel()
  const maxMs = Math.max(...p.minutesByDay.map((d) => d.ms), 1)
  const diff = p.accuracy !== null && p.accuracyLast !== null ? p.accuracy - p.accuracyLast : null

  return (
    <main className="panel">
      <h1 className="sr">Panel</h1>

      <div className="tile t-fuego in" style={delay(0)}>
        <h2 className="k">Racha</h2>
        <p className="v"><span className="flame" aria-hidden="true">🔥</span> {p.streak.current}</p>
        <p className="k">{p.streak.best > 0 ? `Tu récord: ${plural(p.streak.best, 'día', 'días')}` : 'Haz 1 lección hoy para empezar'}</p>
      </div>
      <div className="tile t-lila in" style={delay(40)}>
        <h2 className="k">Esta semana</h2>
        <p className="v">{formatMinutes(p.weekMs)}</p>
        <p className="k">{plural(p.weekLessons, 'lección', 'lecciones')}</p>
      </div>
      <div className="tile t-cielo in" style={delay(80)}>
        <h2 className="k">Aciertos</h2>
        <p className="v">{p.accuracy === null ? '—' : `${p.accuracy}%`}</p>
        <p className="k">
          {p.accuracy === null ? 'Sin ejercicios esta semana'
            : diff === null ? 'Esta semana'
            : diff === 0 ? 'Igual que la semana pasada'
            : `${plural(Math.abs(diff), 'punto', 'puntos')} ${diff > 0 ? 'más' : 'menos'} que la semana pasada`}
        </p>
      </div>
      <div className="tile t-menta in" style={delay(120)}>
        <h2 className="k">Exámenes aprobados</h2>
        <p className="v">—</p>
        <p className="k">Llegan con los exámenes de unidad</p>
      </div>

      <section className="tile t-blanco span3 in" style={delay(160)} aria-labelledby="h-heat">
        <h2 id="h-heat">Constancia</h2>
        <p className="sub">Último año · {plural(p.lessonsByDay.size, 'día activo', 'días activos')}</p>
        <div className="heat-scroll">
          <div className="heat" role="img" aria-label={`Lecciones por día en el último año: ${plural(p.lessonsByDay.size, 'día activo', 'días activos')}`}>
            {yearGrid(p.today).flat().map((d, i) => {
              if (!d) return <i key={i} className="none" />
              const n = p.lessonsByDay.get(d) ?? 0
              return <i key={i} data-l={heatLevel(n)} className={d === p.today ? 'hoy' : undefined} title={`${label(d)}: ${plural(n, 'lección', 'lecciones')}`} />
            })}
          </div>
        </div>
        <div className="legend" aria-hidden="true">Menos <i data-l="0" /><i data-l="1" /><i data-l="2" /><i data-l="3" /><i data-l="4" /> Más</div>
      </section>

      <section className="tile t-blanco bars-tile in" style={delay(200)} aria-labelledby="h-week">
        <h2 id="h-week">Esta semana</h2>
        <p className="sub">Minutos por día</p>
        <ul className="bars">
          {p.minutesByDay.map((d, i) => (
            <li key={d.day} className={d.day === p.today ? 'hoy' : undefined}>
              <span style={{ height: `${Math.max(6, (d.ms / maxMs) * 100)}%`, animationDelay: `${300 + i * 40}ms` }} />
              <small aria-hidden="true">{DOW[i][0]}</small>
              <span className="sr">{DOW[i]}{d.day === p.today ? ' (hoy)' : ''}: {formatMinutes(d.ms)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="tile t-blanco span2 in" style={delay(240)} aria-labelledby="h-weak">
        <h2 id="h-weak">Conceptos que te cuestan</h2>
        <p className="sub">Cada uno te lleva a un repaso y a la página del PDF de donde salió</p>
        {p.weak.length === 0 ? (
          <p className="empty">Todavía no hay fallos. Cuando te equivoques en un concepto, aparecerá aquí.</p>
        ) : (
          <ul className="weak">
            {p.weak.map((w) => (
              <li key={w.id} style={{ '--c': w.subject?.color ?? 'var(--lila)' } as React.CSSProperties}>
                <span className="dot" aria-label={`${w.fails} fallos de ${w.n} intentos`}>{w.fails}/{w.n}</span>
                <div className="w-txt">
                  <b>{w.name}</b>
                  <small>{w.subject?.name}{w.source && ` · ${w.source.file}, p. ${w.source.page}`}</small>
                </div>
                <Link className="go" href={`/repaso/${w.id}`} aria-label={`Repasar: ${w.name}`}>Repasar →</Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tile t-blanco in" style={delay(280)} aria-labelledby="h-prog">
        <h2 id="h-prog">Avance</h2>
        <p className="sub">Unidades completadas</p>
        <ul className="prog">
          {p.progress.map(({ subject, complete, total }, i) => (
            <li key={subject.id} style={{ '--c': subject.color } as React.CSSProperties}>
              <span className="t">{subject.name}</span>
              <span className="track" role="img" aria-label={total ? `${complete} de ${total}` : 'Sin unidades'}>
                <i style={{ width: `${total ? (complete / total) * 100 : 0}%`, animationDelay: `${500 + i * 60}ms` }} />
              </span>
              <small aria-hidden="true">{total ? `${complete}/${total}` : '—'}</small>
            </li>
          ))}
        </ul>
      </section>

      <section className="tile t-blanco in" style={delay(320)} aria-labelledby="h-exam">
        <h2 id="h-exam">Exámenes</h2>
        <p className="sub">Historial</p>
        <p className="empty">Aún no hay exámenes. Llegarán al final de cada unidad.</p>
      </section>
    </main>
  )
}

export default function Page() {
  return <Suspense fallback={null}><Panel /></Suspense>
}
