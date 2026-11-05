'use server'

import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { lessonCompletions, lessons } from '@/db/schema'
import { requireUser } from '@/lib/supabase/server'

/** Salta un estudio: lo marca completado con skipped=true (desbloquea la práctica, no cuenta para la racha). Idempotente. */
export async function skipStudy(lessonId: string): Promise<void> {
  await requireUser()
  const id = z.string().uuid().parse(lessonId)
  await db.transaction(async (tx) => {
    const [lesson] = await tx.select({ kind: lessons.kind }).from(lessons).where(eq(lessons.id, id))
    if (!lesson || lesson.kind !== 'estudio') throw new Error('Solo se puede saltar una lección de estudio')
    const [prev] = await tx.select({ id: lessonCompletions.id }).from(lessonCompletions).where(and(eq(lessonCompletions.lessonId, id)))
    if (!prev) await tx.insert(lessonCompletions).values({ lessonId: id, skipped: true })
  })
}
