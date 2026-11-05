import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StudyBody, type StudyPayload } from '@/components/estudio/StudyBody'
import { getLessonForPlay } from '@/lib/queries'
import { isStudyKind } from '@/lib/exercises/types'
import { requireUser } from '@/lib/supabase/server'

async function Apunte({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params
  await requireUser()
  const lesson = await getLessonForPlay(lessonId)
  if (!lesson || lesson.kind !== 'estudio') notFound()
  const cards = lesson.exercises.filter((e) => isStudyKind(e.payload.kind))
  return (
    <div className="apunte-page">
      <header className="ap-top">
        <Link href={`/materia/${lesson.subjectId}`} className="ap-back">← Volver al camino</Link>
        <Link href={`/leccion/${lessonId}`} className="ap-study">Estudiar con tarjetas</Link>
      </header>
      <main>
        <p className="ap-kicker">Apunte</p>
        <h1 className="ap-title">{lesson.title}</h1>
        {cards.map((c) => (
          <article key={c.id} className="ap-card">
            <StudyBody payload={c.payload as StudyPayload} open heading="h2" />
            {c.source && <p className="ap-src">Fuente: {c.source.file}, p. {c.source.page}{c.source.verified === false && ' · cita sin verificar'}</p>}
          </article>
        ))}
      </main>
    </div>
  )
}

export default function Page({ params }: PageProps<'/leccion/[lessonId]/apunte'>) {
  return <Suspense fallback={null}><Apunte params={params} /></Suspense>
}
