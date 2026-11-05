'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { skipStudy } from '@/app/(app)/materia/[subjectId]/actions'

/** "Saltar estudio" con confirmación en línea (sin modal), como en Duolingo. */
export function SkipStudy({ lessonId, title }: { lessonId: string; title: string }) {
  const router = useRouter()
  const [asking, setAsking] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState(false)
  const noRef = useRef<HTMLButtonElement>(null)
  const linkRef = useRef<HTMLButtonElement>(null)
  const refocus = useRef(false)

  useEffect(() => {
    if (!refocus.current) return
    refocus.current = false
    ;(asking ? noRef : linkRef).current?.focus()
  }, [asking])

  async function yes() {
    if (busy) return
    setBusy(true)
    setErr(false)
    try {
      await skipStudy(lessonId)
      router.refresh()
    } catch {
      setErr(true)
      setBusy(false)
    }
  }

  if (!asking)
    return (
      <button ref={linkRef} type="button" className="skip" onClick={() => { refocus.current = true; setAsking(true) }} aria-label={`Saltar estudio: ${title}`}>
        Saltar estudio
      </button>
    )
  return (
    <div className="skip-ask" role="group" aria-label="Confirmar saltar estudio">
      <span>¿Ya dominas este tema?</span>
      <button type="button" onClick={yes} disabled={busy}>Sí</button>
      <span aria-hidden="true">·</span>
      <button ref={noRef} type="button" onClick={() => { refocus.current = true; setAsking(false) }} disabled={busy}>No</button>
      {err && <span className="skip-err" role="status">No se pudo saltar</span>}
    </div>
  )
}
