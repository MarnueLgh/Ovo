import type { Source } from '@/lib/exercises/types'
import { CheckBar } from '@/components/lesson/CheckBar'
import { StudyBody, type StudyPayload } from './StudyBody'

/** Una tarjeta de estudio en el reproductor: contenido, fuente y "Siguiente" (no se califica). */
export function StudyCard({ payload, source, last, saving, onContinue }: {
  payload: StudyPayload; source: Source | null; last: boolean; saving: boolean; onContinue: (kb: boolean) => void
}) {
  return (
    <>
      <StudyBody payload={payload} />
      {source && <p className="src">Fuente: {source.file}, p. {source.page}{source.verified === false && ' · cita sin verificar'}</p>}
      <CheckBar label={last ? 'Terminar estudio' : 'Siguiente'} disabled={saving} onClick={onContinue} />
    </>
  )
}
