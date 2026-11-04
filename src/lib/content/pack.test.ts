import { describe, it, expect } from 'vitest'
import { PackSchema } from './pack'

const rel = {
  kind: 'relacionar',
  prompt: 'p',
  concept: 'c1',
  source: { file: 'a.pdf', page: 1 },
  pairs: [1, 2, 3].map((i) => ({ term: `t${i}`, definition: `d${i}` })),
}
const caso = (options: unknown[]) => ({
  kind: 'caso_practico', question: 'q', scene: 's', explanation: 'e', concept: 'c1', options,
})
const pack = (exercises: unknown[]) => ({
  subject: 'Redes',
  unit: { number: 1, title: 'U1' },
  files: [{ name: 'a.pdf', kind: 'pdf' }],
  concepts: [{ key: 'c1', name: 'C1' }],
  lessons: [{ title: 'L1', exercises }],
})
const opts2 = [{ text: 'a', correct: true }, { text: 'b', correct: false, whyWrong: 'x' }]
const src = { file: 'a.pdf', page: 1 }

describe('PackSchema', () => {
  it('pack mínimo válido', () => expect(PackSchema.safeParse(pack([rel])).success).toBe(true))
  it('lessonId uuid', () => {
    const p = { ...pack([rel]), lessons: [{ lessonId: '3b241101-e2bb-4255-8caf-4136c566a962', exercises: [rel] }] }
    expect(PackSchema.safeParse(p).success).toBe(true)
  })
  it('concepto inexistente apunta al campo', () => {
    const r = PackSchema.safeParse(pack([{ ...rel, concept: 'zz' }]))
    expect(r.success).toBe(false)
    expect(r.error!.issues.map((i) => i.path)).toContainEqual(['lessons', 0, 'exercises', 0, 'concept'])
  })
  it('caso sin source falla', () => {
    expect(PackSchema.safeParse(pack([caso(opts2)])).success).toBe(false)
  })
  it('caso con dos correctas falla (refinements se conservan)', () => {
    const bad = { ...caso([{ text: 'a', correct: true }, { text: 'b', correct: true }]), source: src }
    expect(PackSchema.safeParse(pack([bad])).success).toBe(false)
    expect(PackSchema.safeParse(pack([{ ...bad, options: opts2 }])).success).toBe(true)
  })
  it('caso con incorrecta sin whyWrong falla', () => {
    const bad = { ...caso([{ text: 'a', correct: true }, { text: 'b', correct: false }]), source: src }
    expect(PackSchema.safeParse(pack([bad])).success).toBe(false)
  })
  it('calculo sin source ok', () => {
    expect(PackSchema.safeParse(pack([{ kind: 'calculo', generator: 'subneteo', concept: 'c1' }])).success).toBe(true)
  })
  it('source.file desconocido falla', () => {
    expect(PackSchema.safeParse(pack([{ ...rel, source: { file: 'x.pdf', page: 1 } }])).success).toBe(false)
  })
  it('keys duplicadas y tamaño de lección fallan', () => {
    const p = pack([rel])
    p.concepts.push({ key: 'c1', name: 'dup' })
    expect(PackSchema.safeParse(p).success).toBe(false)
    expect(PackSchema.safeParse(pack([])).success).toBe(false)
    expect(PackSchema.safeParse(pack(Array(13).fill(rel))).success).toBe(false)
  })
  it('abierta valida keyPoints', () => {
    const ab = (k: string[]) => ({ kind: 'abierta', question: 'q', modelAnswer: 'm', keyPoints: k, concept: 'c1', source: src })
    expect(PackSchema.safeParse(pack([ab(['a', 'b'])])).success).toBe(true)
    expect(PackSchema.safeParse(pack([ab(['a'])])).success).toBe(false)
  })
})
