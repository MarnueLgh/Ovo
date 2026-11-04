'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { completeLesson, recordAttempt, reportExercise } from '@/app/(lesson)/leccion/[lessonId]/actions'
import { newAttemptId } from '@/lib/exercises/grade'
import type { ExercisePayload, Source } from '@/lib/exercises/types'
import { Abierta } from './Abierta'
import { CalculoSubneteo } from './CalculoSubneteo'
import { CasoPractico } from './CasoPractico'
import type { ExerciseResult } from './CheckBar'
import { DatoClave } from './DatoClave'
import { Relacionar } from './Relacionar'
import './leccion.css'

type Ex = { id: string; conceptId: string | null; source: Source | null; payload: ExercisePayload }

export function LessonPlayer({ lessonId, subjectId, exercises: all, streak }: { lessonId: string; subjectId: string; exercises: Ex[]; streak: number }) {
  const router = useRouter()
  const [i, setI] = useState(0)
  const [saving, setSaving] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [kb, setKb] = useState(false)
  const [exercises, setExercises] = useState(all) // sin los reportados en esta partida
  const [asking, setAsking] = useState(false)
  const [repErr, setRepErr] = useState(false)
  const reporting = useRef(false)
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

  async function finish() {
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

  async function onContinue(viaKeyboard: boolean) {
    if (finishing.current || Date.now() - changedAt.current < 300) return
    setKb(viaKeyboard)
    setNote(null)
    setAsking(false)
    setRepErr(false)
    if (i < exercises.length - 1) {
      changedAt.current = Date.now()
      return setI(i + 1)
    }
    await finish()
  }

  async function onReport(viaKeyboard: boolean) {
    if (reporting.current || finishing.current) return
    reporting.current = true
    setRepErr(false)
    try {
      await reportExercise(ex.id)
    } catch {
      setAsking(false)
      setRepErr(true)
      reporting.current = false
      return
    }
    setAsking(false)
    setKb(viaKeyboard)
    changedAt.current = Date.now()
    reporting.current = false
    if (i < exercises.length - 1) setExercises((l) => l.filter((e) => e.id !== ex.id)) // el siguiente ocupa el mismo índice; no se registra intento
    else await finish()
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
        <span className="streak"><span aria-hidden="true">🔥 {streak}</span><span className="sr">Racha: {streak} {streak === 1 ? 'día' : 'días'}</span></span>
      </header>
      <main className="stage">
        <div className="rep" aria-live="polite">
          {asking ? (
            <>
              <span>¿Quitar este ejercicio?</span>
              <button type="button" onClick={(e) => onReport(e.detail === 0)}>Sí</button>
              <span aria-hidden="true">·</span>
              <button type="button" onClick={() => setAsking(false)}>No</button>
            </>
          ) : (
            <button type="button" onClick={() => setAsking(true)}>Esto está mal</button>
          )}
          {repErr && <span className="err">No se pudo reportar</span>}
        </div>
        <div key={ex.id} className={`ex${kb ? '' : ' enter'}`}>
          {p.kind === 'dato_clave' ? <DatoClave payload={p} {...props} />
            : p.kind === 'relacionar' ? <Relacionar payload={p} {...props} />
            : p.kind === 'abierta' ? <Abierta payload={p} {...props} />
            : p.kind === 'caso_practico' ? <CasoPractico payload={p} {...props} />
            : <CalculoSubneteo payload={p} {...props} />}
        </div>
      </main>
    </div>
  )
}
