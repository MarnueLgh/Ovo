import { normalizeForMatch } from './quotes'

/** Grupo de variantes efectivo de un ejercicio: el guardado, o el que el importador asigna por omisión (concepto+tipo). */
export const effectiveGroup = (e: { variantGroup: string | null; conceptName: string | null; kind: string }) =>
  e.variantGroup ?? `${normalizeForMatch(e.conceptName ?? '')}:${e.kind}`

type Reported = { id: string; lessonId: string; group: string }

/**
 * Por cada ejercicio nuevo de una lección existente, elige UN reportado de la misma lección y grupo (en el orden dado).
 * Devuelve los ids a limpiar (`reported_at`) y los índices de `incoming` que no reemplazan a ninguno.
 */
export function matchReplacements(reported: Reported[], incoming: { lessonId: string; group: string }[]) {
  const taken = new Set<string>()
  const unmatched: number[] = []
  incoming.forEach((n, i) => {
    const hit = reported.find((r) => !taken.has(r.id) && r.lessonId === n.lessonId && r.group === n.group)
    if (hit) taken.add(hit.id)
    else unmatched.push(i)
  })
  return { clear: [...taken], unmatched }
}
