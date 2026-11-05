import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PathNode } from '@/components/PathNode'
import { StreakTile } from '@/components/StreakTile'
import { getLessonSummary, getStreak, getSubjectPath, getSubjects, getUnitFiles } from '@/lib/queries'
import { requireUser } from '@/lib/supabase/server'

const KIND_LABEL: Record<string, string> = { dato_clave: 'Dato clave', relacionar: 'Relacionar', caso_practico: 'Caso práctico', calculo: 'Cálculo', abierta: 'Respuesta abierta' }

async function Camino({ params }: { params: Promise<{ subjectId: string }> }) {
  const { subjectId } = await params
  await requireUser()
  const [subjects, path, streak] = await Promise.all([getSubjects(), getSubjectPath(subjectId), getStreak()])
  if (!path) notFound()
  const { subject, units } = path

  const next = units.flatMap((u) => u.lessons).find((l) => l.state === 'current')
  const last = units.flatMap((u) => u.lessons).at(-1)
  const summary = next ? await getLessonSummary(next.lesson.id, next.lesson.kind) : null
  const nextStudy = next?.lesson.kind === 'estudio'
  const currentUnit = units.find((u) => u.lessons.some((l) => l.state === 'current')) ?? units[0]
  const unitFiles = currentUnit ? await getUnitFiles(currentUnit.unit.id) : []

  return (
    <div className="camino" style={{ '--c': subject.color } as React.CSSProperties}>
      <main>
        <div className="chips in">
          {subjects.map((s) => (
            <Link key={s.id} href={`/materia/${s.id}`} className={s.id === subject.id ? 'chip on' : 'chip'} aria-current={s.id === subject.id ? 'page' : undefined}>
              {s.name}
            </Link>
          ))}
        </div>
        <div className="hero in" style={{ animationDelay: '40ms' }}>
          <div className="hero-emoji" aria-hidden="true">{subject.emoji}</div>
          <h1>{currentUnit ? `Unidad ${currentUnit.unit.number}` : 'Sin unidades'}</h1>
        </div>

        {units.map(({ unit, lessons }, ui) => {
          const done = lessons.filter((l) => l.state === 'done').length
          const complete = lessons.length > 0 && done === lessons.length
          const active = lessons.some((l) => l.state === 'current')
          const tone = complete ? 'u-done' : active ? 'u-now' : 'u-off'
          const delay = { animationDelay: `${80 + ui * 40}ms` }
          return (
            <section key={unit.id} aria-labelledby={`u-${unit.id}`}>
              <div className={`unit ${tone} in`} style={delay}>
                <div>
                  <h2 id={`u-${unit.id}`}>Unidad {unit.number} · {unit.title}</h2>
                  <small>{lessons.length === 0 ? 'Sin material todavía' : complete ? 'Completada' : `${done} de ${lessons.length} lecciones`}</small>
                </div>
                <span aria-hidden="true">{complete ? '✓' : lessons.length === 0 ? '🔒' : ''}</span>
              </div>
              <div className="path">
                {lessons.length === 0 ? (
                  <div className="gate g-empty in" style={delay}>
                    <span className="ic" aria-hidden="true">📥</span>
                    <div><h3>Sube los PDFs de esta unidad</h3><p>Ovo arma las lecciones en cuanto los subas.</p></div>
                  </div>
                ) : (
                  <>
                    {lessons.map((l, i) => (
                      <div key={l.lesson.id} className="step-wrap">
                        {l.section && l.section !== lessons[i - 1]?.section && <h3 className="sec-label in">{l.section}</h3>}
                        <PathNode index={i} state={l.state} lessonId={l.lesson.id} title={l.lesson.title} kind={l.lesson.kind} />
                      </div>
                    ))}
                    <div className="gate g-lock in" style={delay}>
                      <span className="ic" aria-hidden="true">🎯</span>
                      <div><h3>Examen de unidad: próximamente</h3><p>Llegará con la fase 3.</p></div>
                    </div>
                  </>
                )}
              </div>
            </section>
          )
        })}
      </main>

      <aside className="rail" aria-label="Resumen">
        <StreakTile current={streak.current} best={streak.best} />
        <div className="tile t-cielo in" style={{ animationDelay: '80ms' }}>
          <h2 className="k">{nextStudy ? 'Siguiente estudio' : 'Siguiente lección'}</h2>
          {next ? (
            <>
              <p className="next-title">{next.lesson.title}</p>
              {next.section && <p className="next-sec">{next.section}</p>}
              {summary && nextStudy && (
                <div className="tags"><span className="tag">{summary.count} {summary.count === 1 ? 'tarjeta' : 'tarjetas'}</span></div>
              )}
              {summary && !nextStudy && (
                <div className="tags">
                  {summary.kinds.map((k) => <span key={k} className="tag">{KIND_LABEL[k] ?? k}</span>)}
                  <span className="tag">{summary.count} {summary.count === 1 ? 'ejercicio' : 'ejercicios'}</span>
                </div>
              )}
              <Link className="cta" href={`/leccion/${next.lesson.id}`}>{nextStudy ? 'Estudiar' : 'Empezar lección'}</Link>
            </>
          ) : (
            <>
              <p className="next-title">Nada pendiente por ahora</p>
              {last && <Link className="cta" href={`/leccion/${last.lesson.id}`}>Repetir: {last.lesson.title}</Link>}
            </>
          )}
        </div>
        {currentUnit && (
          <div className="tile t-files in" style={{ animationDelay: '120ms' }}>
            <h2 className="k">Archivos de la unidad {currentUnit.unit.number}</h2>
            {unitFiles.length === 0 ? (
              <p className="f-empty">Sin archivos todavía.</p>
            ) : (
              <ul className="flist">
                {unitFiles.map((f) => (
                  <li key={f.name}>
                    <span aria-hidden="true">{f.kind === 'pdf' ? '📄' : '🖼️'}</span>
                    <span className="fname">{f.name}</span>
                    {f.pages ? <small>{f.pages} p.</small> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>
    </div>
  )
}

export default function Page({ params }: PageProps<'/materia/[subjectId]'>) {
  return <Suspense fallback={null}><Camino params={params} /></Suspense>
}
