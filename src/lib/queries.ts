import { and, asc, count, eq, exists, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { attempts, concepts, examDates, exercises, files, lessonCompletions, lessons, sections, subjects, units } from '@/db/schema'
import { computeNodeStates, type NodeState } from '@/lib/path'
import { computeStreak } from '@/lib/streak'
import { toLocalDay } from '@/lib/time'
import { pickVariants } from '@/lib/content/variants'
import { isStudyKind, parsePayload, type Source } from '@/lib/exercises/types'
import { lastWeekOf, weekOf } from '@/lib/panel'
import { isUuid } from '@/lib/uuid'

// Lección con >=1 ejercicio activo.
const hasActive = exists(db.select({ one: exercises.id }).from(exercises).where(and(eq(exercises.lessonId, lessons.id), isNull(exercises.retiredAt))))

export const getSubjects = () => db.select().from(subjects).orderBy(asc(subjects.position))

export async function getSubjectPath(subjectId: string) {
  if (!isUuid(subjectId)) return null
  const [subject] = await db.select().from(subjects).where(eq(subjects.id, subjectId))
  if (!subject) return null
  const unitRows = await db.select().from(units).where(eq(units.subjectId, subjectId)).orderBy(asc(units.position))
  const lessonRows = await db
    .select({ lesson: lessons })
    .from(lessons)
    .innerJoin(units, eq(lessons.unitId, units.id))
    // Solo lecciones con >=1 ejercicio activo: una vacía sería la "actual" (y /leccion daría 404), bloqueando el camino.
    .where(and(eq(units.subjectId, subjectId), hasActive))
  const done = new Set((await db.select({ id: lessonCompletions.lessonId }).from(lessonCompletions)).map((r) => r.id))
  const sectionRows = unitRows.length
    ? await db.select().from(sections).innerJoin(units, eq(sections.unitId, units.id)).where(eq(units.subjectId, subjectId))
    : []
  const sectionTitle = new Map(sectionRows.map((r) => [r.sections.id, r.sections.title]))

  // Orden de la materia entero: la lección "actual" es la primera sin completar de todo el camino.
  const unitPos = new Map(unitRows.map((u) => [u.id, u.position]))
  const ordered = lessonRows
    .map((r) => r.lesson)
    .sort((a, b) => unitPos.get(a.unitId)! - unitPos.get(b.unitId)! || a.position - b.position)
  const states = computeNodeStates(ordered.map((l) => l.id), done)
  const stateOf = new Map<string, NodeState>(ordered.map((l, i) => [l.id, states[i]]))

  return {
    subject,
    units: unitRows.map((unit) => ({
      unit,
      lessons: ordered.filter((l) => l.unitId === unit.id).map((lesson) => ({
        lesson, state: stateOf.get(lesson.id)!, section: lesson.sectionId ? sectionTitle.get(lesson.sectionId) ?? null : null,
      })),
    })),
  }
}

export async function getStreak() {
  // Un estudio saltado desbloquea la práctica pero no cuenta para la racha.
  const rows = await db.select({ at: lessonCompletions.completedAt }).from(lessonCompletions).where(eq(lessonCompletions.skipped, false))
  return computeStreak(rows.map((r) => toLocalDay(r.at)), toLocalDay(new Date()))
}

/** Ejercicios activos de la lección que una partida mostraría: una variante por grupo (la menos intentada).
 *  En lecciones de estudio no hay variantes: se muestran todas las tarjetas en orden. */
async function pickedExercises(lessonId: string, kind: string = 'practica') {
  const rows = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.lessonId, lessonId), isNull(exercises.retiredAt)))
    .orderBy(asc(exercises.position))
  if (rows.length === 0 || kind === 'estudio') return rows
  const counts = await db
    .select({ id: attempts.exerciseId, n: count() })
    .from(attempts)
    .innerJoin(exercises, eq(attempts.exerciseId, exercises.id))
    .where(eq(exercises.lessonId, lessonId))
    .groupBy(attempts.exerciseId)
  const seen = new Map(counts.map((c) => [c.id, c.n]))
  return pickVariants(rows.map((r) => ({ ...r, group: r.variantGroup })), seen)
}

/** Tipos de ejercicio (sin repetir, en orden de posición) y total de lo que mostraría una partida. */
export async function getLessonSummary(lessonId: string, kind?: string) {
  const rows = await pickedExercises(lessonId, kind)
  return { kinds: [...new Set(rows.map((r) => r.kind))], count: rows.length }
}

/** Lección con sus ejercicios activos (en orden) y la materia a la que regresar. null si no existe o no tiene ejercicios. */
export async function getLessonForPlay(lessonId: string) {
  if (!isUuid(lessonId)) return null
  const [row] = await db
    .select({ lesson: lessons, subjectId: units.subjectId })
    .from(lessons)
    .innerJoin(units, eq(lessons.unitId, units.id))
    .where(eq(lessons.id, lessonId))
  if (!row) return null
  const rows = await pickedExercises(lessonId, row.lesson.kind)
  if (rows.length === 0) return null
  return {
    title: row.lesson.title,
    kind: row.lesson.kind as 'estudio' | 'practica',
    subjectId: row.subjectId,
    exercises: rows.map((e) => ({ id: e.id, conceptId: e.conceptId, source: e.source, payload: parsePayload(e.payload) })),
  }
}

/** Archivos de una unidad (para la tarjeta del camino). */
export const getUnitFiles = (unitId: string) =>
  db.select({ name: files.name, kind: files.kind, pages: files.pages }).from(files).where(eq(files.unitId, unitId)).orderBy(asc(files.name))

/** Material por materia → unidad: archivos, lecciones y ejercicios activos; más los reportados pendientes (con `reported_at`; igual que `npm run reportados`). */
export async function getMaterial() {
  const [subjectRows, unitRows, fileRows, lessonRows, exRows] = await Promise.all([
    getSubjects(),
    db.select().from(units).orderBy(asc(units.position)),
    db.select().from(files).orderBy(asc(files.name)),
    db.select({ id: lessons.id, unitId: lessons.unitId }).from(lessons),
    db.select().from(exercises),
  ])
  const unitOfLesson = new Map(lessonRows.map((l) => [l.id, l.unitId]))
  const active = exRows.filter((e) => !e.retiredAt)
  const pending = exRows.filter((e) => e.reportedAt).length
  return {
    pending,
    subjects: subjectRows.map((subject) => ({
      subject,
      units: unitRows
        .filter((u) => u.subjectId === subject.id)
        .map((unit) => ({
          unit,
          files: fileRows.filter((f) => f.unitId === unit.id),
          lessons: lessonRows.filter((l) => l.unitId === unit.id).length,
          exercises: active.filter((e) => unitOfLesson.get(e.lessonId) === unit.id).length,
        })),
    })),
  }
}

const avgPct = (xs: { score: number }[]) => (xs.length ? Math.round((xs.reduce((a, x) => a + x.score, 0) / xs.length) * 100) : null)

/** Todo lo del panel. ponytail: trae todos los intentos y los agrega en JS; pasar a SQL si crecen a decenas de miles. */
export async function getPanel() {
  const today = toLocalDay(new Date())
  const week = weekOf(today)
  const lastWeek = new Set(lastWeekOf(today))
  const [streak, att, comps, subjectRows, unitRows, lessonRows, conceptRows] = await Promise.all([
    getStreak(),
    // El concepto sale del ejercicio (servidor), no del conceptId que manda el cliente.
    db.select({ at: attempts.answeredAt, score: attempts.score, correct: attempts.correct, ms: attempts.durationMs, conceptId: exercises.conceptId, source: exercises.source })
      .from(attempts).innerJoin(exercises, eq(attempts.exerciseId, exercises.id)),
    db.select({ lessonId: lessonCompletions.lessonId, at: lessonCompletions.completedAt, skipped: lessonCompletions.skipped }).from(lessonCompletions),
    getSubjects(),
    db.select().from(units),
    db.select({ id: lessons.id, unitId: lessons.unitId }).from(lessons).where(hasActive),
    db.select({ id: concepts.id, name: concepts.name, subjectId: units.subjectId }).from(concepts).innerJoin(units, eq(concepts.unitId, units.id)),
  ])

  const days = att.map((a) => ({ ...a, day: toLocalDay(a.at) }))
  const lessonsByDay = new Map<string, number>()
  for (const c of comps) if (!c.skipped) { const d = toLocalDay(c.at); lessonsByDay.set(d, (lessonsByDay.get(d) ?? 0) + 1) }

  const thisWeek = days.filter((a) => week.includes(a.day))
  const minutesByDay = week.map((d) => ({ day: d, ms: thisWeek.filter((a) => a.day === d).reduce((s, a) => s + a.ms, 0) }))

  // Conceptos con al menos un fallo, peor promedio primero.
  const byConcept = new Map<string, { n: number; fails: number; sum: number; source: Source | null }>()
  for (const a of att) {
    if (!a.conceptId) continue
    const c = byConcept.get(a.conceptId) ?? { n: 0, fails: 0, sum: 0, source: null }
    c.n++
    c.sum += a.score
    if (!a.correct) { c.fails++; c.source = a.source ?? c.source }
    else c.source ??= a.source
    byConcept.set(a.conceptId, c)
  }
  const conceptOf = new Map(conceptRows.map((c) => [c.id, c]))
  const subjectOf = new Map(subjectRows.map((s) => [s.id, s]))
  const weak = [...byConcept]
    .filter(([id, c]) => c.fails > 0 && conceptOf.has(id))
    .sort(([, a], [, b]) => a.sum / a.n - b.sum / b.n || b.fails - a.fails)
    .slice(0, 5)
    .map(([id, c]) => ({ id, name: conceptOf.get(id)!.name, subject: subjectOf.get(conceptOf.get(id)!.subjectId), fails: c.fails, n: c.n, source: c.source }))

  // Unidad completada = todas sus lecciones activas hechas (hasta que existan los exámenes).
  const done = new Set(comps.map((c) => c.lessonId))
  const progress = subjectRows.map((subject) => {
    const us = unitRows.filter((u) => u.subjectId === subject.id)
    const complete = us.filter((u) => {
      const ls = lessonRows.filter((l) => l.unitId === u.id)
      return ls.length > 0 && ls.every((l) => done.has(l.id))
    }).length
    return { subject, complete, total: us.length }
  })

  return {
    today,
    streak,
    weekMs: thisWeek.reduce((s, a) => s + a.ms, 0),
    weekLessons: week.reduce((s, d) => s + (lessonsByDay.get(d) ?? 0), 0),
    accuracy: avgPct(thisWeek),
    accuracyLast: avgPct(days.filter((a) => lastWeek.has(a.day))),
    minutesByDay,
    lessonsByDay,
    weak,
    progress,
  }
}

/** Repaso de un concepto: sus ejercicios de práctica activos, la variante menos vista de cada grupo. */
export async function getReview(conceptId: string) {
  if (!isUuid(conceptId)) return null
  const [c] = await db.select({ name: concepts.name, subjectId: units.subjectId }).from(concepts).innerJoin(units, eq(concepts.unitId, units.id)).where(eq(concepts.id, conceptId))
  if (!c) return null
  const rows = (await db.select().from(exercises).where(and(eq(exercises.conceptId, conceptId), isNull(exercises.retiredAt))).orderBy(asc(exercises.position)))
    .filter((r) => !isStudyKind(r.kind))
  if (rows.length === 0) return null
  const counts = await db
    .select({ id: attempts.exerciseId, n: count() })
    .from(attempts)
    .innerJoin(exercises, eq(attempts.exerciseId, exercises.id))
    .where(eq(exercises.conceptId, conceptId))
    .groupBy(attempts.exerciseId)
  const seen = new Map(counts.map((r) => [r.id, r.n]))
  const picked = pickVariants(rows.map((r) => ({ ...r, group: r.variantGroup })), seen)
  return {
    name: c.name,
    subjectId: c.subjectId,
    exercises: picked.map((e) => ({ id: e.id, conceptId: e.conceptId, source: e.source, payload: parsePayload(e.payload) })),
  }
}

/** Inicio: materias con su unidad actual y avance, días activos de la semana, racha y fechas de examen. */
export async function getHome() {
  const today = toLocalDay(new Date())
  const [streak, subjectRows, unitRows, lessonRows, comps, exams] = await Promise.all([
    getStreak(),
    getSubjects(),
    db.select().from(units).orderBy(asc(units.position)),
    db.select({ id: lessons.id, unitId: lessons.unitId, position: lessons.position }).from(lessons).where(hasActive),
    db.select({ lessonId: lessonCompletions.lessonId, at: lessonCompletions.completedAt, skipped: lessonCompletions.skipped }).from(lessonCompletions),
    db.select({ id: examDates.id, on: examDates.on, subjectId: examDates.subjectId, unitId: examDates.unitId }).from(examDates).orderBy(asc(examDates.on)),
  ])
  const done = new Set(comps.map((c) => c.lessonId))
  const activeDays = new Set(comps.filter((c) => !c.skipped).map((c) => toLocalDay(c.at)))
  const unitNum = new Map(unitRows.map((u) => [u.id, u.number]))

  const subjects = subjectRows.map((subject) => {
    const us = unitRows.filter((u) => u.subjectId === subject.id)
    const ls = lessonRows.filter((l) => us.some((u) => u.id === l.unitId))
    const pos = new Map(us.map((u) => [u.id, u.position]))
    const next = ls.sort((a, b) => pos.get(a.unitId)! - pos.get(b.unitId)! || a.position - b.position).find((l) => !done.has(l.id))
    const unit = next ? us.find((u) => u.id === next.unitId) : us.at(-1)
    return { subject, unit: unit ? unit.number : null, done: ls.filter((l) => done.has(l.id)).length, total: ls.length }
  })

  return {
    today,
    streak,
    week: weekOf(today).map((d) => ({ day: d, active: activeDays.has(d) })),
    subjects,
    units: unitRows.map((u) => ({ id: u.id, subjectId: u.subjectId, number: u.number, title: u.title })),
    exams: exams.map((e) => ({ ...e, unit: e.unitId ? unitNum.get(e.unitId) ?? null : null })),
  }
}
