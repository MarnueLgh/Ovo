import { and, asc, count, eq, exists, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { attempts, exercises, files, lessonCompletions, lessons, subjects, units } from '@/db/schema'
import { computeNodeStates, type NodeState } from '@/lib/path'
import { computeStreak } from '@/lib/streak'
import { toLocalDay } from '@/lib/time'
import { pickVariants } from '@/lib/content/variants'
import { replacementKey, withoutReplacement } from '@/lib/content/reportados'
import { parsePayload } from '@/lib/exercises/types'
import { isUuid } from '@/lib/uuid'

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
    .where(
      and(
        eq(units.subjectId, subjectId),
        exists(db.select({ one: exercises.id }).from(exercises).where(and(eq(exercises.lessonId, lessons.id), isNull(exercises.retiredAt)))),
      ),
    )
  const done = new Set((await db.select({ id: lessonCompletions.lessonId }).from(lessonCompletions)).map((r) => r.id))

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
      lessons: ordered.filter((l) => l.unitId === unit.id).map((lesson) => ({ lesson, state: stateOf.get(lesson.id)! })),
    })),
  }
}

export async function getStreak() {
  const rows = await db.select({ at: lessonCompletions.completedAt }).from(lessonCompletions)
  return computeStreak(rows.map((r) => toLocalDay(r.at)), toLocalDay(new Date()))
}

/** Ejercicios activos de la lección que una partida mostraría: una variante por grupo (la menos intentada). */
async function pickedExercises(lessonId: string) {
  const rows = await db
    .select()
    .from(exercises)
    .where(and(eq(exercises.lessonId, lessonId), isNull(exercises.retiredAt)))
    .orderBy(asc(exercises.position))
  if (rows.length === 0) return rows
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
export async function getLessonSummary(lessonId: string) {
  const rows = await pickedExercises(lessonId)
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
  const rows = await pickedExercises(lessonId)
  if (rows.length === 0) return null
  return {
    title: row.lesson.title,
    subjectId: row.subjectId,
    exercises: rows.map((e) => ({ id: e.id, conceptId: e.conceptId, source: e.source, payload: parsePayload(e.payload) })),
  }
}

/** Archivos de una unidad (para la tarjeta del camino). */
export const getUnitFiles = (unitId: string) =>
  db.select({ name: files.name, kind: files.kind, pages: files.pages }).from(files).where(eq(files.unitId, unitId)).orderBy(asc(files.name))

/** Material por materia → unidad: archivos, lecciones y ejercicios activos; más los reportados sin reemplazo (misma regla que `npm run reportados`). */
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
  const keyed = (e: (typeof exRows)[number]) => ({ lessonId: e.lessonId, key: replacementKey(e) })
  const pending = withoutReplacement(exRows.filter((e) => e.reportedAt).map(keyed), active.map(keyed)).length
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
