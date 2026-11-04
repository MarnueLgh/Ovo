// Uso: npm run importar -- <paquete.json> [--dry-run] [--material <dir>]
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { and, eq, inArray, max } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { extractText, getDocumentProxy } from 'unpdf'
import * as s from '../src/db/schema'
import { planImport } from '../src/lib/content/import'
import { PackSchema } from '../src/lib/content/pack'

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const mi = args.indexOf('--material')
const materialDir = mi >= 0 ? args[mi + 1] : 'material'
const jsonPath = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--material')

class Fallo extends Error {}
const client = postgres(process.env.DATABASE_URL!, { prepare: false })
const db = drizzle(client)

async function main() {
  if (!jsonPath) throw new Fallo('Uso: npm run importar -- <paquete.json> [--dry-run] [--material <dir>]')
  if (!existsSync(jsonPath)) throw new Fallo(`No existe el archivo: ${jsonPath}`)
  const raw = readFileSync(jsonPath)
  const hash = createHash('sha256').update(raw).digest('hex')

  const [prev] = await db.select().from(s.imports).where(eq(s.imports.hash, hash))
  if (prev) throw new Fallo(`Este paquete ya se importó el ${prev.importedAt.toLocaleString('es-MX')}`)

  let json: unknown
  try { json = JSON.parse(raw.toString('utf8')) } catch (e) { throw new Fallo(`JSON inválido: ${(e as Error).message}`) }
  const parsed = PackSchema.safeParse(json)
  if (!parsed.success)
    throw new Fallo(parsed.error.issues.map((i) => `${i.path.join('.') || '(raíz)'}: ${i.message}`).join('\n'))
  const pack = parsed.data

  const subjects = await db.select().from(s.subjects)
  const subject = subjects.find((x) => x.name === pack.subject)
  if (!subject) throw new Fallo(`Materia desconocida "${pack.subject}". Materias válidas:\n- ${subjects.map((x) => x.name).join('\n- ')}`)

  const [unit] = await db.select().from(s.units).where(and(eq(s.units.subjectId, subject.id), eq(s.units.number, pack.unit.number)))
  const lessonIds = pack.lessons.flatMap((l) => (l.lessonId ? [l.lessonId] : []))
  const nextEx = new Map<string, number>()
  if (lessonIds.length) {
    const found = await db.select({ id: s.lessons.id, unitId: s.lessons.unitId }).from(s.lessons).where(inArray(s.lessons.id, lessonIds))
    for (const id of lessonIds) {
      const f = found.find((x) => x.id === id)
      if (!f) throw new Fallo(`lessonId inexistente: ${id}`)
      if (f.unitId !== unit?.id) throw new Fallo(`La lección ${id} no pertenece a la unidad ${pack.unit.number} de ${pack.subject}`)
    }
    const rows = await db.select({ id: s.exercises.lessonId, m: max(s.exercises.position) }).from(s.exercises)
      .where(inArray(s.exercises.lessonId, lessonIds)).groupBy(s.exercises.lessonId)
    for (const id of lessonIds) nextEx.set(id, (rows.find((r) => r.id === id)?.m ?? -1) + 1)
  }

  // Archivos: todos deben existir antes de escribir nada.
  const dir = join(materialDir, pack.subject, String(pack.unit.number))
  const missing = pack.files.filter((f) => !existsSync(join(dir, f.name))).map((f) => join(dir, f.name))
  if (missing.length) throw new Fallo(`Faltan archivos:\n${missing.map((m) => `- ${m}`).join('\n')}`)
  const pagesByFile = new Map<string, string[] | null>()
  for (const f of pack.files) {
    if (f.kind === 'imagen') { pagesByFile.set(f.name, null); continue }
    const pdf = await getDocumentProxy(new Uint8Array(readFileSync(join(dir, f.name))))
    pagesByFile.set(f.name, (await extractText(pdf, { mergePages: false })).text)
  }

  const concepts = unit ? await db.select().from(s.concepts).where(eq(s.concepts.unitId, unit.id)) : []
  const [{ lm }] = unit ? await db.select({ lm: max(s.lessons.position) }).from(s.lessons).where(eq(s.lessons.unitId, unit.id)) : [{ lm: null }]
  const plan = planImport(pack, pagesByFile, {
    unitId: unit?.id,
    nextLessonPosition: (lm ?? -1) + 1,
    conceptIds: new Map(concepts.map((c) => [c.name, c.id])),
    nextExercisePositionByLesson: nextEx,
  })

  const nuevas = plan.lessons.filter((l) => l.lessonId === undefined).length
  const nEx = plan.lessons.reduce((n, l) => n + l.exercises.length, 0)
  plan.warnings.forEach((w) => console.warn(`AVISO ${w}`))
  const resumen = `Unidad ${pack.unit.number} · ${nuevas} lecciones nuevas · ${nEx} ejercicios · ${plan.unverified} citas sin verificar`
  if (dryRun) return console.log(`[dry-run, no se escribió nada] ${resumen}`)

  await db.transaction(async (tx) => {
    let unitId = unit?.id
    if (!unitId) {
      const [{ pm }] = await tx.select({ pm: max(s.units.position) }).from(s.units).where(eq(s.units.subjectId, subject.id))
      ;[{ id: unitId }] = await tx.insert(s.units).values({
        subjectId: subject.id, number: pack.unit.number, title: pack.unit.title, position: (pm ?? -1) + 1,
      }).returning({ id: s.units.id })
    }
    const ids = new Map(concepts.map((c) => [c.name, c.id]))
    if (plan.newConcepts.length) {
      const ins = await tx.insert(s.concepts).values(plan.newConcepts.map((name) => ({ unitId: unitId!, name }))).returning()
      ins.forEach((c) => ids.set(c.name, c.id))
    }
    for (const f of plan.files)
      await tx.insert(s.files).values({ unitId, ...f }).onConflictDoUpdate({ target: [s.files.unitId, s.files.name], set: { pages: f.pages, kind: f.kind } })
    for (const l of plan.lessons) {
      const lessonId = l.lessonId ?? (await tx.insert(s.lessons).values({ unitId, position: l.position!, title: l.title! }).returning({ id: s.lessons.id }))[0].id
      await tx.insert(s.exercises).values(l.exercises.map((e) => ({
        lessonId, conceptId: ids.get(e.conceptName)!, position: e.position, kind: e.kind,
        payload: e.payload, source: e.source, variantGroup: e.variantGroup,
      })))
    }
    await tx.insert(s.imports).values({ hash, file: jsonPath })
  })
  console.log(resumen)
}

main().then(
  () => client.end(),
  (e) => { console.error(e instanceof Fallo ? e.message : e); return client.end().then(() => process.exit(1)) },
)
