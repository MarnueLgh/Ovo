import { Suspense } from 'react'
import { getMaterial } from '@/lib/queries'
import { requireUser } from '@/lib/supabase/server'
import './material.css'

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

async function Material() {
  await requireUser()
  const { subjects, pending } = await getMaterial()
  return (
    <main className="material">
      <h1>Material</h1>

      <section className="how in" aria-labelledby="how-h">
        <h2 id="how-h">Cómo agregar material</h2>
        <ol>
          <li>Guarda los archivos en <code>material/&lt;Materia&gt;/&lt;número de unidad&gt;/</code>.</li>
          <li>En Claude Code escribe <code>/generar-unidad &lt;Materia&gt; &lt;número&gt;</code>.</li>
          <li>Corre <code>npm run importar -- contenido/&lt;archivo&gt;.json</code>.</li>
        </ol>
        {pending > 0 && (
          <p className="pend">
            {plural(pending, 'ejercicio reportado', 'ejercicios reportados')} por reemplazar: pide a Claude Code <code>/generar-unidad</code> en modo reemplazo.
          </p>
        )}
      </section>

      {subjects.map(({ subject, units }, si) => (
        <section key={subject.id} className="subj in" style={{ '--c': subject.color, animationDelay: `${60 + si * 30}ms` } as React.CSSProperties} aria-labelledby={`s-${subject.id}`}>
          <h2 id={`s-${subject.id}`}><span aria-hidden="true">{subject.emoji}</span> {subject.name}</h2>
          {units.length === 0 ? (
            <p className="empty">Sin unidades todavía.</p>
          ) : (
            units.map(({ unit, files, lessons, exercises }) => (
              <div key={unit.id} className="unit-card">
                <h3>Unidad {unit.number} · {unit.title}</h3>
                <p className="counts">{plural(lessons, 'lección', 'lecciones')} · {plural(exercises, 'ejercicio activo', 'ejercicios activos')}</p>
                {files.length === 0 ? (
                  <p className="empty">Sin archivos.</p>
                ) : (
                  <ul>
                    {files.map((f) => (
                      <li key={f.id}>
                        <span aria-hidden="true">{f.kind === 'pdf' ? '📄' : f.kind === 'markdown' ? '📝' : '🖼️'}</span>
                        <span className="fname">{f.name}</span>
                        <small>{f.kind === 'markdown' ? 'nota' : f.pages ? plural(f.pages, 'página', 'páginas') : 'imagen'}</small>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))
          )}
        </section>
      ))}
    </main>
  )
}

export default function Page() {
  return <Suspense fallback={null}><Material /></Suspense>
}
