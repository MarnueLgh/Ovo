import { z } from 'zod'
import { Abierta, Calculo, CasoPracticoBase, DatoClave, Relacionar, SourceSchema, withCasoChecks } from '../exercises/types'

const meta = { concept: z.string(), group: z.string().optional(), source: SourceSchema.optional() }

// Cada miembro se extiende con `meta`; el caso práctico conserva sus refinamientos.
const PackExerciseSchema = z.discriminatedUnion('kind', [
  DatoClave.extend(meta),
  Relacionar.extend(meta),
  withCasoChecks(CasoPracticoBase.extend(meta)),
  Calculo.extend(meta),
  Abierta.extend(meta),
])
export type PackExercise = z.infer<typeof PackExerciseSchema>

const Lesson = z
  .object({
    title: z.string().min(1).optional(),
    lessonId: z.string().uuid().optional(),
    exercises: z.array(PackExerciseSchema),
  })
  .refine((l) => (l.title !== undefined) !== (l.lessonId !== undefined), {
    message: 'La lección necesita exactamente uno de title o lessonId',
  })

export const PackSchema = z
  .object({
    subject: z.string().min(1),
    unit: z.object({ number: z.number().int().min(1), title: z.string() }),
    files: z.array(z.object({ name: z.string(), kind: z.enum(['pdf', 'imagen']) })),
    concepts: z.array(z.object({ key: z.string(), name: z.string() })),
    lessons: z.array(Lesson),
  })
  .superRefine((p, ctx) => {
    const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })
    const keys = new Set<string>()
    p.concepts.forEach((c, i) => {
      if (keys.has(c.key)) issue(['concepts', i, 'key'], `Concepto duplicado: ${c.key}`)
      keys.add(c.key)
    })
    const files = new Set(p.files.map((f) => f.name))
    p.lessons.forEach((l, li) => {
      if (l.exercises.length < 1 || l.exercises.length > 12)
        issue(['lessons', li, 'exercises'], 'Cada lección debe tener entre 1 y 12 ejercicios')
      l.exercises.forEach((e, ei) => {
        const at = ['lessons', li, 'exercises', ei]
        if (!keys.has(e.concept)) issue([...at, 'concept'], `Concepto inexistente: ${e.concept}`)
        if (e.kind !== 'calculo' && !e.source) issue([...at, 'source'], 'Falta source')
        if (e.source && !files.has(e.source.file))
          issue([...at, 'source', 'file'], `Archivo no listado en files: ${e.source.file}`)
      })
    })
  })
export type Pack = z.infer<typeof PackSchema>
