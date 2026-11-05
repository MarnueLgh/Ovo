// Borra exactamente lo que creó el fixture: unidad 99 de Telecomunicaciones I y todo lo que cuelga de ella,
// más la fila de imports con el hash de paquete-ejemplo.json.
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { and, eq, inArray, like, or } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as s from '../../src/db/schema'

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
const db = drizzle(client)
const FIXTURE = 'scripts/fixtures/paquete-ejemplo.json'
const bytes = readFileSync(FIXTURE)
const hash = createHash('sha256').update(bytes).digest('hex')
const fixtureTitle: string = JSON.parse(bytes.toString('utf8')).unit.title

async function main() {
  await db.transaction(async (tx) => {
    const [subj] = await tx.select().from(s.subjects).where(eq(s.subjects.name, 'Telecomunicaciones I'))
    if (!subj) throw new Error('No existe la materia "Telecomunicaciones I"; no se borró nada')
    const [unit] = await tx.select().from(s.units).where(and(eq(s.units.subjectId, subj.id), eq(s.units.number, 99)))
    if (unit && unit.title !== fixtureTitle)
      throw new Error(`La unidad 99 se llama "${unit.title}", no "${fixtureTitle}": no parece la del fixture, no se borró nada`)
    if (unit) {
      const ls = (await tx.select({ id: s.lessons.id }).from(s.lessons).where(eq(s.lessons.unitId, unit.id))).map((l) => l.id)
      if (ls.length) {
        const ex = (await tx.select({ id: s.exercises.id }).from(s.exercises).where(inArray(s.exercises.lessonId, ls))).map((e) => e.id)
        if (ex.length) await tx.delete(s.attempts).where(inArray(s.attempts.exerciseId, ex))
        await tx.delete(s.exercises).where(inArray(s.exercises.lessonId, ls))
        await tx.delete(s.lessonCompletions).where(inArray(s.lessonCompletions.lessonId, ls))
        await tx.delete(s.lessons).where(eq(s.lessons.unitId, unit.id))
      }
      await tx.delete(s.concepts).where(eq(s.concepts.unitId, unit.id))
      await tx.delete(s.files).where(eq(s.files.unitId, unit.id))
      await tx.delete(s.sections).where(eq(s.sections.unitId, unit.id))
      await tx.delete(s.units).where(eq(s.units.id, unit.id))
    }
    await tx.delete(s.imports).where(or(eq(s.imports.hash, hash), eq(s.imports.file, FIXTURE), like(s.imports.file, '%fixtures%paquete-ejemplo.json')))
  })
  console.log('Fixture limpiado')
}
main().then(() => client.end(), (e) => { console.error(e instanceof Error ? e.message : e); return client.end().then(() => process.exit(1)) })
