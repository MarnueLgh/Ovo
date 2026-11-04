import { z } from 'zod'

const Bullets = z.object({ title: z.string(), bullets: z.array(z.string()) })

export const DatoClave = z.object({
  kind: z.literal('dato_clave'),
  title: z.string(),
  lead: z.string(),
  left: Bullets,
  right: Bullets,
  rule: z.object({ headline: z.string(), text: z.string() }),
})

export const Relacionar = z.object({
  kind: z.literal('relacionar'),
  prompt: z.string(),
  pairs: z.array(z.object({ term: z.string(), definition: z.string() })).min(3).max(6),
})

export const CasoPractico = z
  .object({
    kind: z.literal('caso_practico'),
    question: z.string(),
    scene: z.string(),
    options: z.array(z.object({ text: z.string(), correct: z.boolean(), whyWrong: z.string().optional() })).min(2),
    explanation: z.string(),
  })
  .refine((c) => c.options.filter((o) => o.correct).length === 1, {
    message: 'Debe haber exactamente una opción correcta',
  })
  .refine((c) => c.options.every((o) => o.correct || !!o.whyWrong), {
    message: 'Cada opción incorrecta necesita whyWrong',
  })

export const Calculo = z.object({ kind: z.literal('calculo'), generator: z.literal('subneteo') })

export const ExercisePayloadSchema = z.discriminatedUnion('kind', [DatoClave, Relacionar, CasoPractico, Calculo])

export type DatoClave = z.infer<typeof DatoClave>
export type Relacionar = z.infer<typeof Relacionar>
export type CasoPractico = z.infer<typeof CasoPractico>
export type Calculo = z.infer<typeof Calculo>
export type ExercisePayload = z.infer<typeof ExercisePayloadSchema>

export type Source = { file: string; page: number; quote?: string }

export const parsePayload = (x: unknown): ExercisePayload => ExercisePayloadSchema.parse(x)
