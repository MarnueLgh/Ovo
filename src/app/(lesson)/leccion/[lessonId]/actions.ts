'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { attempts, exercises, lessonCompletions } from '@/db/schema'
import { requireUser } from '@/lib/supabase/server'

const Attempt = z.object({
  id: z.uuid(),
  exerciseId: z.uuid(),
  conceptId: z.uuid().nullable(),
  score: z.number().min(0).max(1),
  correct: z.boolean(),
  durationMs: z.number().int().min(0).max(2_147_483_647),
})

export async function recordAttempt(input: z.input<typeof Attempt>): Promise<void> {
  await requireUser()
  const a = Attempt.parse(input)
  // El id lo genera el cliente una vez por ejercicio: reintentos y doble clic no duplican filas.
  await db.insert(attempts).values(a).onConflictDoNothing()
}

export async function completeLesson(lessonId: string): Promise<void> {
  await requireUser()
  await db.insert(lessonCompletions).values({ lessonId: z.uuid().parse(lessonId) })
}

/** "Esto está mal": retira el ejercicio y lo marca para reemplazo. Idempotente. */
export async function reportExercise(exerciseId: string): Promise<void> {
  await requireUser()
  const id = z.uuid().parse(exerciseId)
  await db.update(exercises).set({ retiredAt: new Date(), reportedAt: new Date() }).where(and(eq(exercises.id, id), isNull(exercises.retiredAt)))
}
