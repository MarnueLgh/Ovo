// Uso: npm run reportados — ejercicios reportados ("Esto está mal") sin reemplazo activo, por materia y unidad.
import { config } from 'dotenv'
config({ path: '.env.local' })

import { asc, eq, isNotNull, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as s from '../src/db/schema'
import { replacementKey, withoutReplacement } from '../src/lib/content/reportados'
import type { ExercisePayload } from '../src/lib/exercises/types'

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
const db = drizzle(client)

const mainText = (p: ExercisePayload): string =>
  p.kind === 'dato_clave' ? p.title
  : p.kind === 'relacionar' ? `${p.prompt} (${p.pairs[0].term}: ${p.pairs[0].definition})`
  : p.kind === 'calculo' ? 'Cálculo de subneteo'
  : p.question

async function main() {
  const rows = await db
    .select({ e: s.exercises, lesson: s.lessons, unit: s.units, subject: s.subjects, concept: s.concepts.name })
    .from(s.exercises)
    .innerJoin(s.lessons, eq(s.exercises.lessonId, s.lessons.id))
    .innerJoin(s.units, eq(s.lessons.unitId, s.units.id))
    .innerJoin(s.subjects, eq(s.units.subjectId, s.subjects.id))
    .leftJoin(s.concepts, eq(s.exercises.conceptId, s.concepts.id))
    .where(isNotNull(s.exercises.reportedAt))
    .orderBy(asc(s.subjects.position), asc(s.units.position), asc(s.lessons.position), asc(s.exercises.position))
  const active = (await db.select().from(s.exercises).where(isNull(s.exercises.retiredAt))).map((e) => ({ lessonId: e.lessonId, key: replacementKey(e) }))
  const pending = withoutReplacement(rows.map((r) => ({ ...r, lessonId: r.e.lessonId, key: replacementKey(r.e) })), active)
  if (pending.length === 0) return console.log('No hay ejercicios reportados sin reemplazo.')

  let head = ''
  for (const r of pending) {
    const h = `${r.subject.name} · Unidad ${r.unit.number}: ${r.unit.title}`
    if (h !== head) console.log(`\n${(head = h)}`)
    const src = r.e.source ? `${r.e.source.file} p. ${r.e.source.page}` : 'sin fuente'
    console.log(`\n  ejercicio ${r.e.id}  (${r.e.kind})`)
    console.log(`    lección:  ${r.lesson.id}  "${r.lesson.title}"`)
    console.log(`    concepto: ${r.concept ?? '(ninguno)'}   fuente: ${src}`)
    console.log(`    texto:    ${mainText(r.e.payload)}`)
  }
  console.log(`\n${pending.length} por reemplazar. Genera un paquete con { "lessonId": ... } para cada lección.`)
}
main().then(() => client.end(), (e) => { console.error(e instanceof Error ? e.message : e); return client.end().then(() => process.exit(1)) })
