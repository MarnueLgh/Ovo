import { z } from 'zod'
import {
  Abierta, Calculo, CasoPracticoBase, ComparacionBase, Concepto, DatoClave, DiagramaBase, Flashcard, Lista, Relacionar,
  SourceSchema, isStudyKind, withCasoChecks, withComparacionChecks, withDiagramaChecks,
} from '../exercises/types'

// `verified` lo decide solo el importador; si el paquete lo trae, se descarta (zod quita claves desconocidas).
const PackSource = SourceSchema.omit({ verified: true })
const meta = { concept: z.string(), group: z.string().optional(), source: PackSource.optional() }

// Cada miembro se extiende con `meta`; el caso práctico conserva sus refinamientos.
const PackExerciseSchema = z.discriminatedUnion('kind', [
  DatoClave.extend(meta),
  Relacionar.extend(meta),
  withCasoChecks(CasoPracticoBase.extend(meta)),
  Calculo.extend(meta),
  Abierta.extend(meta),
  Concepto.extend(meta),
  Flashcard.extend(meta),
  withComparacionChecks(ComparacionBase.extend(meta)),
  withDiagramaChecks(DiagramaBase.extend(meta)),
  Lista.extend(meta),
])
export type PackExercise = z.infer<typeof PackExerciseSchema>

const Lesson = z
  .object({
    title: z.string().min(1).optional(),
    lessonId: z.string().uuid().optional(),
    kind: z.enum(['estudio', 'practica']).default('practica'),
    section: z.string().min(1).optional(), // título de la subsección (tema)
    exercises: z.array(PackExerciseSchema).max(40),
  })
  .refine((l) => (l.title !== undefined) !== (l.lessonId !== undefined), {
    message: 'La lección necesita exactamente uno de title o lessonId',
  })

export const PackSchema = z
  .object({
    subject: z.string().min(1),
    unit: z.object({ number: z.number().int().min(1), title: z.string() }),
    files: z.array(z.object({ name: z.string(), kind: z.enum(['pdf', 'imagen', 'markdown']) })),
    concepts: z.array(z.object({ key: z.string(), name: z.string() })),
    lessons: z.array(Lesson).min(1),
  })
  .superRefine((p, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })
    const keys = new Set<string>()
    p.concepts.forEach((c, i) => {
      if (keys.has(c.key)) issue(['concepts', i, 'key'], `Concepto duplicado: ${c.key}`)
      keys.add(c.key)
    })
    const files = new Map(p.files.map((f) => [f.name, f.kind]))
    const sectioned = p.lessons.some((l) => l.section)
    p.lessons.forEach((l, li) => {
      if (sectioned && l.title !== undefined && !l.section)
        issue(['lessons', li, 'section'], 'Si una lección tiene section, todas las lecciones nuevas deben tenerla')
      if (l.kind === 'estudio') {
        if (l.exercises.length < 1) issue(['lessons', li, 'exercises'], 'Una lección de estudio necesita al menos 1 tarjeta')
      } else {
        // Una partida muestra un ejercicio por grupo de variantes: el tamaño se mide en grupos distintos.
        // Grupo por omisión: concepto+tipo (equivale a nombre+tipo dentro de un mismo paquete).
        const groups = new Set(l.exercises.map((e) => e.group ?? `${e.concept}:${e.kind}`)).size
        if (groups < 1 || groups > 12)
          issue(['lessons', li, 'exercises'], `Cada lección debe tener entre 1 y 12 grupos de variantes distintos (tiene ${groups})`)
        if (l.exercises.length > 36) issue(['lessons', li, 'exercises'], 'Una práctica admite hasta 36 ejercicios')
      }
      l.exercises.forEach((e, ei) => {
        const at = ['lessons', li, 'exercises', ei]
        if (l.kind === 'estudio' && !isStudyKind(e.kind)) issue([...at, 'kind'], `Una lección de estudio solo admite tarjetas de estudio, no "${e.kind}"`)
        if (l.kind === 'practica' && isStudyKind(e.kind)) issue([...at, 'kind'], `"${e.kind}" es una tarjeta de estudio: va en una lección con kind "estudio"`)
        if (!keys.has(e.concept)) issue([...at, 'concept'], `Concepto inexistente: ${e.concept}`)
        if (e.kind !== 'calculo' && !e.source) issue([...at, 'source'], 'Falta source')
        if (e.source && !files.has(e.source.file))
          issue([...at, 'source', 'file'], `Archivo no listado en files: ${e.source.file}`)
        else if (e.source && files.get(e.source.file) !== 'imagen' && !e.source.quote?.trim())
          issue([...at, 'source', 'quote'], 'Las fuentes de un PDF o markdown requieren quote (cita literal)')
      })
    })
  })
export type Pack = z.infer<typeof PackSchema>
