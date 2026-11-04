import type { ExercisePayload, Source } from '../exercises/types'
import { findQuotePage, normalizeForMatch } from './quotes'
import type { Pack } from './pack'

export type Existing = {
  unitId?: string
  nextLessonPosition: number
  conceptIds: Map<string, string> // nombre -> id
  nextExercisePositionByLesson: Map<string, number>
}

export type PlannedExercise = {
  position: number
  conceptName: string
  kind: string
  payload: ExercisePayload
  source: Source | null
  variantGroup: string
}
export type PlannedLesson = { lessonId?: string; position?: number; title?: string; exercises: PlannedExercise[] }

export type Plan = {
  warnings: string[]
  unit: { number: number; title: string; unitId?: string }
  newConcepts: string[] // nombres que hay que crear
  files: { name: string; kind: 'pdf' | 'imagen'; pages: number | null }[]
  lessons: PlannedLesson[]
  unverified: number
}

export function planImport(pack: Pack, pagesByFile: Map<string, string[] | null>, existing: Existing): Plan {
  const warnings: string[] = []
  let unverified = 0
  const nameByKey = new Map(pack.concepts.map((c) => [c.key, c.name]))
  const newConcepts = [...new Set(pack.concepts.map((c) => c.name))].filter((n) => !existing.conceptIds.has(n))
  const nextEx = new Map(existing.nextExercisePositionByLesson)
  pack.lessons.forEach((l) => {
    if (l.lessonId !== undefined && !nextEx.has(l.lessonId)) throw new Error(`lessonId sin posiciones conocidas: ${l.lessonId}`)
  })
  let nextLesson = existing.nextLessonPosition

  const lessons = pack.lessons.map((l, li): PlannedLesson => {
    const planned: PlannedLesson =
      l.lessonId !== undefined ? { lessonId: l.lessonId, exercises: [] } : { position: nextLesson++, title: l.title, exercises: [] }
    const key = l.lessonId ?? `new:${li}`
    l.exercises.forEach((e, ei) => {
      const { concept, group, source, ...payload } = e
      const where = `Lección ${li + 1}, ejercicio ${ei + 1}`
      let src: Source | null = null
      if (source) {
        src = { ...source }
        const pages = pagesByFile.get(source.file) ?? null
        if (pages) {
          if (!source.quote) {
            warnings.push(`${where}: sin cita textual en ${source.file} p. ${source.page}; no se pudo verificar`)
          } else {
            const found = findQuotePage(source.quote, pages, source.page)
            if (found === null) {
              src.verified = false
              unverified++
              warnings.push(`${where}: la cita no aparece en ${source.file}; se conserva p. ${source.page} sin verificar`)
            } else {
              src.verified = true
              if (found !== source.page) {
                warnings.push(`${where}: la cita estaba en la p. ${found} de ${source.file}, no en la ${source.page}; página corregida`)
                src.page = found
              }
            }
          }
        }
      }
      const conceptName = nameByKey.get(concept)!
      const position = nextEx.get(key) ?? 0
      nextEx.set(key, position + 1)
      planned.exercises.push({
        position,
        conceptName,
        kind: e.kind,
        payload: payload as ExercisePayload,
        source: src,
        variantGroup: group ?? `${normalizeForMatch(conceptName)}:${e.kind}`,
      })
    })
    return planned
  })

  const files = pack.files.map((f) => ({ ...f, pages: pagesByFile.get(f.name)?.length ?? null }))
  return { warnings, unit: { ...pack.unit, unitId: existing.unitId }, newConcepts, files, lessons, unverified }
}
