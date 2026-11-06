'use server'

import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db'
import { examDates, units } from '@/db/schema'
import { requireUser } from '@/lib/supabase/server'

const Exam = z.object({
  subjectId: z.uuid(),
  unitId: z.uuid().nullable(),
  on: z.iso.date(),
})

export async function addExam(input: z.input<typeof Exam>): Promise<void> {
  await requireUser()
  const e = Exam.parse(input)
  if (e.unitId) {
    const [u] = await db.select({ id: units.id }).from(units).where(and(eq(units.id, e.unitId), eq(units.subjectId, e.subjectId)))
    if (!u) throw new Error('La unidad no es de esa materia')
  }
  await db.insert(examDates).values(e)
  revalidatePath('/')
}

export async function deleteExam(id: string): Promise<void> {
  await requireUser()
  await db.delete(examDates).where(eq(examDates.id, z.uuid().parse(id)))
  revalidatePath('/')
}
