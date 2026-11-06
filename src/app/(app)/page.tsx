import { Suspense } from 'react'
import Link from 'next/link'
import { Calendario } from '@/components/inicio/Calendario'
import { Foca } from '@/components/Foca'
import { getHome } from '@/lib/queries'
import { requireUser } from '@/lib/supabase/server'
import { APP_TZ } from '@/lib/time'
import './inicio.css'

const DOW = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const DOW_FULL = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']

function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: APP_TZ }).format(new Date()))
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

async function Inicio() {
  await requireUser()
  const h = await getHome()
  const todayDone = h.week.find((d) => d.day === h.today)?.active
  const n = h.streak.current

  return (
    <main className="inicio">
      <header className="hello in">
        <Foca className="foca" />
        <h1>{greeting()}</h1>
      </header>

      <section className="racha in" style={{ animationDelay: '40ms' }} aria-labelledby="racha-h">
        <div className="racha-top">
          <h2 id="racha-h"><span className="flame" aria-hidden="true">🔥</span> {n} {n === 1 ? 'día' : 'días'} de racha</h2>
          <p>{todayDone ? 'Hoy ya estudiaste. ¡Bien!' : n > 0 ? 'Haz 1 lección hoy para mantenerla' : 'Haz 1 lección hoy para empezar una'}</p>
        </div>
        <ol className="semana">
          {h.week.map((d, i) => {
            const today = d.day === h.today
            return (
              <li key={d.day} className={[d.active && 'act', today && 'hoy'].filter(Boolean).join(' ') || undefined}>
                <span aria-hidden="true">{DOW[i]}</span>
                <i aria-hidden="true">
                  {d.active && <svg viewBox="0 0 16 16" width="14" height="14"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </i>
                <span className="sr">{DOW_FULL[i]}{today ? ' (hoy)' : ''}: {d.active ? 'estudiaste' : 'sin estudio'}</span>
              </li>
            )
          })}
        </ol>
      </section>

      <section className="materias in" style={{ animationDelay: '80ms' }} aria-labelledby="mat-h">
        <h2 id="mat-h">Materias</h2>
        <ul className="carrusel">
          {h.subjects.map(({ subject, unit, done, total }) => (
            <li key={subject.id}>
              <Link href={`/materia/${subject.id}`} className="sc" style={{ '--c': subject.color } as React.CSSProperties}>
                <span className="sc-emoji" aria-hidden="true">{subject.emoji}</span>
                <span className="sc-name">{subject.name}</span>
                <span className="sc-unit">{unit ? `Unidad ${unit}` : 'Sin material'}</span>
                <span className="sc-bar" aria-hidden="true"><i style={{ width: `${total ? (done / total) * 100 : 0}%` }} /></span>
                <span className="sc-count">{total ? `${done} de ${total} lecciones` : 'Sube sus PDFs'}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Calendario
        today={h.today}
        exams={h.exams.map((e) => ({ id: e.id, on: e.on, subjectId: e.subjectId, unit: e.unit }))}
        subjects={h.subjects.map(({ subject: s }) => ({ id: s.id, name: s.name, color: s.color, emoji: s.emoji }))}
        units={h.units}
      />
    </main>
  )
}

export default function Page() {
  return <Suspense fallback={null}><Inicio /></Suspense>
}
