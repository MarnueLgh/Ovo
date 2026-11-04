'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { completeLesson, recordAttempt } from '@/app/(lesson)/leccion/[lessonId]/actions'
import { newAttemptId } from '@/lib/exercises/grade'
import type { ExercisePayload, Source } from '@/lib/exercises/types'
import { CalculoSubneteo } from './CalculoSubneteo'
import { CasoPractico } from './CasoPractico'
import type { ExerciseResult } from './CheckBar'
import { DatoClave } from './DatoClave'
import { Relacionar } from './Relacionar'
import './leccion.css'

type Ex = { id: string; conceptId: string | null; source: Source | null; payload: ExercisePayload }

export function LessonPlayer({ lessonId, subjectId, exercises }: { lessonId: string; subjectId: string; exercises: Ex[] }) {
  const router = useRouter()
  const [i, setI] = useState(0)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [kb, setKb] = useState(false)
  const attemptIds = useRef(new Map<string, string>()) // un id por ejercicio, estable ante doble clic/reintentos
  const sent = useRef(new Set<string>())
  const startedAt = useRef(0)
  const changedAt = useRef(0) // ignora un doble clic que saltaría el siguiente ejercicio
  const finishing = useRef(false)
  useEffect(() => { startedAt.current = Date.now() }, [i])

  const ex = exercises[i]

  function onResult(r: ExerciseResult) {
    if (sent.current.has(ex.id)) return
    sent.current.add(ex.id)
    const id = attemptIds.current.get(ex.id) ?? newAttemptId()
    attemptIds.current.set(ex.id, id)
    setSaving(true)
    setNote(null)
    recordAttempt({ id, exerciseId: ex.id, conceptId: ex.conceptId, ...r, durationMs: Math.max(0, Date.now() - startedAt.current) })
      .catch(() => setNote('No se pudo guardar tu respuesta'))
      .finally(() => setSaving(false))
  }

  async function onContinue(viaKeyboard: boolean) {
    if (finishing.current || Date.now() - changedAt.current < 300) return
    setKb(viaKeyboard)
    setNote(null)
    if (i < exercises.length - 1) {
      changedAt.current = Date.now()
      return setI(i + 1)
    }
    finishing.current = true
    setSaving(true)
    try {
      await completeLesson(lessonId)
      router.push(`/materia/${subjectId}`)
    } catch {
      setNote('No se pudo guardar la lección. Inténtalo de nuevo')
      finishing.current = false
      setSaving(false)
    }
  }

  const props = { source: ex.source, onResult, onContinue, saving, note }
  const p = ex.payload
  return (
    <div className="lesson">
      <header className="top">
        <Link className="x" href={`/materia/${subjectId}`} aria-label="Salir de la lección">✕</Link>
        <div className="prog" role="progressbar" aria-label="Progreso de la lección" aria-valuemin={0} aria-valuemax={exercises.length} aria-valuenow={i}>
          {exercises.map((e, j) => <span key={e.id} className={j < i ? 'done' : j === i ? 'on' : undefined} />)}
        </div>
      </header>
      <main className="stage">
        <div key={ex.id} className={`ex${kb ? '' : ' enter'}`}>
          {p.kind === 'dato_clave' ? <DatoClave payload={p} {...props} />
            : p.kind === 'relacionar' ? <Relacionar payload={p} {...props} />
            : p.kind === 'caso_practico' ? <CasoPractico payload={p} {...props} />
            : <CalculoSubneteo payload={p} {...props} />}
        </div>
      </main>
    </div>
  )
}
