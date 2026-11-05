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

// ── Tarjetas de estudio (no se califican) ──
const txt = z.string().min(1)

export const Concepto = z.object({ kind: z.literal('concepto'), title: txt, body: txt, bullets: z.array(txt).max(12).optional() })

export const Flashcard = z.object({ kind: z.literal('flashcard'), front: txt, back: txt })

export const ComparacionBase = z.object({
  kind: z.literal('comparacion'),
  title: txt,
  columns: z.array(txt).min(2).max(4),
  rows: z.array(z.object({ label: txt, cells: z.array(txt) })).min(1).max(12),
})
export const withComparacionChecks = <T extends z.ZodType<z.infer<typeof ComparacionBase>>>(s: T) =>
  s.refine((c) => c.rows.every((r) => r.cells.length === c.columns.length), { message: 'Cada fila necesita una celda por columna' })
export const Comparacion = withComparacionChecks(ComparacionBase)

export type Nodo = { label: string; detail?: string; children?: Nodo[] }
const depth = (n: Nodo): number => 1 + Math.max(0, ...(n.children ?? []).map(depth))
const NodoSchema: z.ZodType<Nodo> = z.lazy(() =>
  z.object({ label: txt, detail: txt.optional(), children: z.array(NodoSchema).min(1).max(8).optional() }),
)

export const DiagramaBase = z.object({
  kind: z.literal('diagrama'),
  title: txt,
  layout: z.enum(['proceso', 'linea_tiempo', 'ciclo', 'jerarquia']),
  nodes: z.array(NodoSchema).min(1).max(12),
})
export const withDiagramaChecks = <T extends z.ZodType<z.infer<typeof DiagramaBase>>>(s: T) =>
  s
  .refine((d) => d.layout === 'jerarquia' || d.nodes.every((n) => !n.children), {
    message: 'Solo la jerarquía admite children',
  })
  .refine((d) => d.layout === 'jerarquia' || d.nodes.length >= 2, { message: 'Se necesitan al menos 2 nodos' })
  .refine((d) => d.nodes.every((n) => depth(n) <= 3), { message: 'La jerarquía admite hasta 3 niveles' })
export const Diagrama = withDiagramaChecks(DiagramaBase)

export const Lista = z.object({ kind: z.literal('lista'), title: txt, intro: txt.optional(), items: z.array(txt).min(2).max(15) })

export const STUDY_KINDS = ['concepto', 'flashcard', 'comparacion', 'diagrama', 'lista'] as const
export const isStudyKind = (k: string) => (STUDY_KINDS as readonly string[]).includes(k)

export const ExercisePayloadSchema = z.discriminatedUnion('kind', [
  DatoClave, Relacionar, CasoPractico, Calculo, Abierta, Concepto, Flashcard, Comparacion, Diagrama, Lista,
])

export type DatoClave = z.infer<typeof DatoClave>
export type Relacionar = z.infer<typeof Relacionar>
export type CasoPractico = z.infer<typeof CasoPractico>
export type Abierta = z.infer<typeof Abierta>
export type Calculo = z.infer<typeof Calculo>
export type Concepto = z.infer<typeof Concepto>
export type Flashcard = z.infer<typeof Flashcard>
export type Comparacion = z.infer<typeof Comparacion>
export type Diagrama = z.infer<typeof Diagrama>
export type Lista = z.infer<typeof Lista>
export type ExercisePayload = z.infer<typeof ExercisePayloadSchema>

export const SourceSchema = z.object({
  file: z.string(),
  page: z.number().int().min(1),
  quote: z.string().optional(),
  verified: z.boolean().optional(),
})
export type Source = z.infer<typeof SourceSchema>

export const parsePayload = (x: unknown): ExercisePayload => ExercisePayloadSchema.parse(x)
