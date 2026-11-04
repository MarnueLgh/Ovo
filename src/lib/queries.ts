import { and, asc, eq, isNull } from 'drizzle-orm'
import { db } from '@/db'
import { exercises, lessonCompletions, lessons, subjects, units } from '@/db/schema'
import { computeNodeStates, type NodeState } from '@/lib/path'
import { computeStreak } from '@/lib/streak'
import { toLocalDay } from '@/lib/time'
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
    .where(eq(units.subjectId, subjectId))
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

/** Tipos de ejercicio (sin repetir, en orden de posición) y total de una lección. */
export async function getLessonSummary(lessonId: string) {
  const rows = await db
    .select({ kind: exercises.kind })
    .from(exercises)
    .where(and(eq(exercises.lessonId, lessonId), isNull(exercises.retiredAt)))
    .orderBy(asc(exercises.position))
  return { kinds: [...new Set(rows.map((r) => r.kind))], count: rows.length }
}
