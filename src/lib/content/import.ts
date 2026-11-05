import { isStudyKind, type ExercisePayload, type Source } from '../exercises/types'
import { findQuotePage, normalizeForMatch } from './quotes'
import { matchReplacements } from './reportados'
import type { Pack } from './pack'

export type Existing = {
  unitId?: string
  nextLessonPosition: number
  conceptIds: Map<string, string> // nombre -> id
  nextExercisePositionByLesson: Map<string, number>
  lessonTitles?: string[] // lecciones que ya tiene la unidad
  reported?: { id: string; lessonId: string; group: string }[] // ejercicios reportados de las lecciones del paquete
}

export type PlannedExercise = {
  position: number
  conceptName: string
  kind: string
  payload: ExercisePayload
  source: Source | null
  variantGroup: string | null // null en tarjetas de estudio: se muestran todas
}
export type PlannedLesson = {
  lessonId?: string
  position?: number
  title?: string
  kind: 'estudio' | 'practica'
  section?: string
  exercises: PlannedExercise[]
  groups: number // ejercicios por partida: grupos de variantes distintos
}

export type Plan = {
  warnings: string[]
  errors: string[] // impiden escribir
  unit: { number: number; title: string; unitId?: string }
  newConcepts: string[] // nombres que hay que crear
  files: { name: string; kind: 'pdf' | 'imagen'; pages: number | null }[]
  lessons: PlannedLesson[]
  unverified: number // cita no encontrada en el PDF
  unverifiable: number // página sin texto (escaneo): no se puede comprobar
  existingLessons: number
  duplicateTitles: string[] // títulos nuevos que ya existen en la unidad
  clearReported: string[] // reportados que estos ejercicios reemplazan
  sections: string[] // títulos de subsección en orden de aparición
  coverage: { file: string; pages: number[] }[] // páginas con texto que ninguna tarjeta de estudio cita
}

/** Páginas (1-based) con texto que no aparecen en `cited`. Portadas vacías o escaneos no cuentan. */
export function uncoveredPages(pages: string[], cited: Set<number>): number[] {
  return pages.flatMap((t, i) => (normalizeForMatch(t) && !cited.has(i + 1) ? [i + 1] : []))
}

const MIN_PER_GAME = 6

export function planImport(pack: Pack, pagesByFile: Map<string, string[] | null>, existing: Existing): Plan {
  const warnings: string[] = []
  const errors: string[] = []
  let unverified = 0
  let unverifiable = 0
  const nameByKey = new Map(pack.concepts.map((c) => [c.key, c.name]))
  const newConcepts = [...new Set(pack.concepts.map((c) => c.name))].filter((n) => !existing.conceptIds.has(n))
  const nextEx = new Map(existing.nextExercisePositionByLesson)
  pack.lessons.forEach((l) => {
    if (l.lessonId !== undefined && !nextEx.has(l.lessonId)) throw new Error(`lessonId sin posiciones conocidas: ${l.lessonId}`)
  })
  let nextLesson = existing.nextLessonPosition
  const incoming: { lessonId: string; group: string }[] = []

  const lessons = pack.lessons.map((l, li): PlannedLesson => {
    const planned: PlannedLesson =
      l.lessonId !== undefined
        ? { lessonId: l.lessonId, kind: l.kind, exercises: [], groups: 0 }
        : { position: nextLesson++, title: l.title, kind: l.kind, section: l.section, exercises: [], groups: 0 }
    const key = l.lessonId ?? `new:${li}`
    l.exercises.forEach((e, ei) => {
      const { concept, group, source, ...payload } = e
      const where = `Lección ${li + 1}, ejercicio ${ei + 1}`
      const at = `lessons.${li}.exercises.${ei}.source`
      let src: Source | null = null
      if (source) {
        // `verified` nunca viene del paquete: solo lo fija este bloque.
        src = { file: source.file, page: source.page, quote: source.quote }
        const pages = pagesByFile.get(source.file) ?? null
        if (source.quote && source.quote.trim().split(/\s+/).length < 3)
          warnings.push(`${where}: la cita "${source.quote}" tiene menos de 3 palabras; cita la frase que respalda el ejercicio`)
        if (pages && source.page > pages.length) {
          errors.push(`${at}.page: ${source.file} tiene ${pages.length} páginas y se cita la ${source.page}`)
        } else if (pages && source.quote) {
          if (!normalizeForMatch(pages[source.page - 1])) {
            unverifiable++
            warnings.push(`${where}: página ${source.page} de ${source.file} sin texto seleccionable: la cita no se puede verificar`)
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
      const variantGroup = isStudyKind(e.kind) ? null : (group ?? `${normalizeForMatch(conceptName)}:${e.kind}`)
      if (l.lessonId !== undefined && variantGroup) incoming.push({ lessonId: l.lessonId, group: variantGroup })
      planned.exercises.push({ position, conceptName, kind: e.kind, payload: payload as ExercisePayload, source: src, variantGroup })
    })
    planned.groups = planned.kind === 'estudio' ? planned.exercises.length : new Set(planned.exercises.map((e) => e.variantGroup)).size
    if (planned.title !== undefined && planned.kind === 'practica' && planned.groups < MIN_PER_GAME)
      warnings.push(`Lección "${planned.title}": solo ${plural(planned.groups, 'ejercicio', 'ejercicios')} por partida (se recomiendan al menos ${MIN_PER_GAME})`)
    return planned
  })

  const { clear, unmatched } = matchReplacements(existing.reported ?? [], incoming)
  unmatched.forEach((i) =>
    warnings.push(`El ejercicio nuevo con grupo "${incoming[i].group}" no reemplaza a ningún reportado de su lección (revisa el grupo con npm run reportados)`),
  )

  const existingTitles = existing.lessonTitles ?? []
  const old = new Set(existingTitles.map(normalizeForMatch))
  const duplicateTitles = lessons.flatMap((l) => (l.title !== undefined && old.has(normalizeForMatch(l.title)) ? [l.title] : []))
  const files = pack.files.map((f) => ({ ...f, pages: pagesByFile.get(f.name)?.length ?? null }))
  const sections = [...new Set(lessons.flatMap((l) => (l.title !== undefined && l.section ? [l.section] : [])))]
  // Cobertura: solo si el paquete trae estudio (un paquete de reemplazo no pretende cubrir el PDF).
  const study = lessons.filter((l) => l.kind === 'estudio')
  const coverage = study.length === 0 ? [] : pack.files.flatMap((f) => {
    const pages = pagesByFile.get(f.name)
    if (!pages) return []
    const cited = new Set(study.flatMap((l) => l.exercises.flatMap((e) => (e.source?.file === f.name ? [e.source.page] : []))))
    const missing = uncoveredPages(pages, cited)
    if (missing.length) warnings.push(`cobertura: ${f.name} páginas sin estudiar: ${missing.join(', ')}`)
    return missing.length ? [{ file: f.name, pages: missing }] : []
  })
  return {
    warnings, errors, unit: { ...pack.unit, unitId: existing.unitId }, newConcepts, files, lessons,
    unverified, unverifiable, existingLessons: existingTitles.length, duplicateTitles, clearReported: clear,
    sections, coverage,
  }
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** Líneas de resumen: totales y, por lección nueva, ejercicios por partida (grupos distintos) y en total. */
export function summarize(plan: Plan): string[] {
  const nuevas = plan.lessons.filter((l) => l.lessonId === undefined)
  const total = plan.lessons.filter((l) => l.kind === 'practica').reduce((n, l) => n + l.exercises.length, 0)
  const cards = plan.lessons.filter((l) => l.kind === 'estudio').reduce((n, l) => n + l.exercises.length, 0)
  const head = [
    `Unidad ${plan.unit.number}`,
    ...(plan.sections.length ? [plural(plan.sections.length, 'subsección', 'subsecciones')] : []),
    `${plural(nuevas.length, 'lección nueva', 'lecciones nuevas')}`,
    ...(cards ? [plural(cards, 'tarjeta de estudio', 'tarjetas de estudio')] : []),
    plural(total, 'ejercicio', 'ejercicios'),
    plural(plan.unverified, 'cita sin verificar', 'citas sin verificar'),
    ...(plan.unverifiable > 0 ? [plural(plan.unverifiable, 'cita no verificable (sin texto)', 'citas no verificables (sin texto)')] : []),
  ].join(' · ')
  return [
    head,
    ...plan.lessons.map((l) =>
      l.lessonId === undefined && l.kind === 'estudio'
        ? `  ${l.section ? `[${l.section}] ` : ''}${l.title} (estudio): ${plural(l.exercises.length, 'tarjeta', 'tarjetas')}`
        : l.lessonId === undefined
        ? `  ${l.section ? `[${l.section}] ` : ''}${l.title}: ${plural(l.groups, 'ejercicio', 'ejercicios')} por partida (${l.exercises.length} en total)`
        : `  lección ${l.lessonId}: ${plural(l.exercises.length, 'ejercicio nuevo', 'ejercicios nuevos')}`,
    ),
  ]
}
