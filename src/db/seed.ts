import { config } from 'dotenv'
config({ path: '.env.local' })

import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { parsePayload, type Source } from '../lib/exercises/types'
import * as s from './schema'

const client = postgres(process.env.DATABASE_URL!, { prepare: false })
const db = drizzle(client)

const SUBJECTS = [
  { name: 'Telecomunicaciones I', color: '#7A4FD8', emoji: '📡' },
  { name: 'Sistemas manejadores de BD relacionales', color: '#1F86CF', emoji: '🗄️' },
  { name: 'Implementación de sistemas', color: '#E3743F', emoji: '☕' },
  { name: 'Cálculo diferencial e integral', color: '#2EA864', emoji: '📈' },
  { name: 'Matemáticas financieras', color: '#C99A08', emoji: '💰' },
  { name: 'Derecho informático', color: '#B8456F', emoji: '⚖️' },
  { name: 'Administración de la función informática', color: '#4A5FC1', emoji: '🗂️' },
]

const source: Source = { file: 'Tema2_Medios.pdf (ejemplo)', page: 9 }

const payloads = [
  {
    kind: 'dato_clave',
    title: 'Cable directo vs. cable cruzado',
    lead: 'Por fuera se ven igual. La diferencia está en cómo van los colores en cada punta.',
    left: {
      title: 'Directo (uno a uno)',
      bullets: ['Misma norma en las dos puntas', 'Une equipos distintos: PC ↔ switch'],
    },
    right: {
      title: 'Cruzado',
      bullets: ['Una punta T568A y la otra T568B', 'Une equipos iguales: PC ↔ PC, switch ↔ switch'],
    },
    rule: {
      headline: '"Iguales se cruzan."',
      text: 'Si los dos equipos son del mismo tipo, usas cable cruzado.',
    },
  },
  {
    kind: 'relacionar',
    prompt: 'Conecta cada término con su definición',
    pairs: [
      { term: 'Cable directo', definition: 'Une equipos distintos, como PC y switch' },
      { term: 'Cable cruzado', definition: 'Une equipos iguales, como dos PCs' },
      { term: 'Fibra monomodo', definition: 'Un solo haz de luz, para distancias largas' },
      { term: 'Par trenzado STP', definition: 'Pares con blindaje contra interferencia' },
    ],
  },
  {
    kind: 'caso_practico',
    question: '¿Qué cable usas?',
    scene:
      'Quieres pasar archivos entre dos laptops conectándolas directamente por Ethernet, sin switch. Sus tarjetas de red son antiguas y no detectan el tipo de cable solas.',
    options: [
      {
        text: 'Cable directo',
        correct: false,
        whyWrong:
          'El cable directo sirve para unir equipos distintos, como una PC y un switch. Dos laptops transmiten por los mismos pines, así que con cable directo las dos "hablarían" por el mismo par y ninguna escucharía.',
      },
      { text: 'Cable cruzado', correct: true },
      {
        text: 'Cable de consola',
        correct: false,
        whyWrong:
          'El cable de consola sirve para configurar routers y switches desde un puerto serial, no para pasar datos entre dos equipos.',
      },
      {
        text: 'Cable coaxial',
        correct: false,
        whyWrong:
          'El coaxial no se usa con tarjetas Ethernet modernas; las laptops tienen conector RJ45 para par trenzado.',
      },
    ],
    explanation: 'Dos laptops son equipos iguales y los iguales se cruzan.',
  },
  { kind: 'calculo', generator: 'subneteo' },
].map(parsePayload)

async function main() {
  if (!process.argv.includes('--force')) {
    const [a] = await db.select({ n: sql<number>`count(*)::int` }).from(s.attempts)
    const [c] = await db.select({ n: sql<number>`count(*)::int` }).from(s.lessonCompletions)
    const [im] = await db.select({ n: sql<number>`count(*)::int` }).from(s.imports)
    if (a.n > 0 || c.n > 0 || im.n > 0) {
      console.error(
        `Seed cancelado: hay ${a.n} intentos, ${c.n} lecciones completadas y ${im.n} paquetes importados, y el seed BORRA todo (incluido tu progreso y el contenido importado). ` +
          'Si de verdad quieres empezar de cero, corre: npm run db:seed -- --force',
      )
      process.exitCode = 1
      return
    }
  }
  await db.transaction(async (tx) => {
    // orden inverso a las FK; todo en una transacción para no dejar la base a medias
    await tx.delete(s.attempts)
    await tx.delete(s.lessonCompletions)
    await tx.delete(s.exercises)
    await tx.delete(s.lessons)
    await tx.delete(s.concepts)
    await tx.delete(s.files)
    await tx.delete(s.sections)
    await tx.delete(s.imports)
    await tx.delete(s.units)
    await tx.delete(s.subjects)

    const subs = await tx
      .insert(s.subjects)
      .values(SUBJECTS.map((x, position) => ({ ...x, position })))
      .returning()
    const telecom = subs.find((x) => x.emoji === '📡')!

    const [, u2] = await tx
      .insert(s.units)
      .values([
        { subjectId: telecom.id, number: 1, title: 'Fundamentos de señales', position: 0 },
        { subjectId: telecom.id, number: 2, title: 'Medios de transmisión', position: 1 },
      ])
      .returning()

    const [lesson] = await tx
      .insert(s.lessons)
      .values({ unitId: u2.id, position: 0, title: 'Cable directo vs. cruzado' })
      .returning()

    await tx.insert(s.exercises).values(
      payloads.map((payload, position) => ({
        lessonId: lesson.id,
        position,
        kind: payload.kind,
        payload,
        source: payload.kind === 'calculo' ? null : source,
      })),
    )
  })
  console.log('seed ok')
}

main().then(
  () => client.end(),
  (e) => {
    console.error(e)
    return client.end().then(() => process.exit(1))
  },
)
