type K = { lessonId: string; key: string }

/** Clave de reemplazo: el grupo de variantes, o concepto+tipo si no tiene grupo. */
export const replacementKey = (e: { variantGroup: string | null; conceptId: string | null; kind: string }) =>
  e.variantGroup ?? `${e.conceptId ?? ''}:${e.kind}`

/** Reportados cuya (lección, clave) ya no tiene ningún ejercicio activo. */
export function withoutReplacement<T extends K>(reported: T[], active: K[]): T[] {
  const live = new Set(active.map((a) => `${a.lessonId}|${a.key}`))
  return reported.filter((r) => !live.has(`${r.lessonId}|${r.key}`))
}
