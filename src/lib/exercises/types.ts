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

export const CasoPracticoBase = z.object({
  kind: z.literal('caso_practico'),
  question: z.string(),
  scene: z.string(),
  options: z.array(z.object({ text: z.string(), correct: z.boolean(), whyWrong: z.string().optional() })).min(2),
  explanation: z.string(),
})

// Reutilizable en variantes extendidas (ejercicios de paquete).
export const withCasoChecks = <T extends z.ZodType<z.infer<typeof CasoPracticoBase>>>(s: T) =>
  s
    .refine((c) => c.options.filter((o) => o.correct).length === 1, {
      message: 'Debe haber exactamente una opción correcta',
    })
    .refine((c) => c.options.every((o) => o.correct || !!o.whyWrong), {
      message: 'Cada opción incorrecta necesita whyWrong',
    })

export const CasoPractico = withCasoChecks(CasoPracticoBase)

export const Abierta = z.object({
  kind: z.literal('abierta'),
  question: z.string().min(1),
  modelAnswer: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).min(2).max(6),
})

export const Calculo = z.object({ kind: z.literal('calculo'), generator: z.literal('subneteo') })

export const ExercisePayloadSchema = z.discriminatedUnion('kind', [DatoClave, Relacionar, CasoPractico, Calculo, Abierta])

export type DatoClave = z.infer<typeof DatoClave>
export type Relacionar = z.infer<typeof Relacionar>
export type CasoPractico = z.infer<typeof CasoPractico>
export type Abierta = z.infer<typeof Abierta>
export type Calculo = z.infer<typeof Calculo>
export type ExercisePayload = z.infer<typeof ExercisePayloadSchema>

export const SourceSchema = z.object({
  file: z.string(),
  page: z.number().int().min(1),
  quote: z.string().optional(),
  verified: z.boolean().optional(),
})
export type Source = z.infer<typeof SourceSchema>

export const parsePayload = (x: unknown): ExercisePayload => ExercisePayloadSchema.parse(x)
