import { describe, expect, it } from 'vitest'
import { planImport, type Existing } from './import'
import { PackSchema } from './pack'

const LID = '11111111-1111-4111-8111-111111111111'
const ab = (extra = {}) => ({
  kind: 'abierta', question: 'q', modelAnswer: 'a', keyPoints: ['x', 'y'], concept: 'c1',
  source: { file: 'a.pdf', page: 1, quote: 'hola mundo' }, ...extra,
})
const mk = (lessons: unknown[], files = [{ name: 'a.pdf', kind: 'pdf' }]) =>
  PackSchema.parse({
    subject: 'S', unit: { number: 9, title: 'U' }, files,
    concepts: [{ key: 'c1', name: 'Uno' }], lessons,
  })
const ex = (o: Partial<Existing> = {}): Existing => ({
  nextLessonPosition: 0, conceptIds: new Map(), nextExercisePositionByLesson: new Map(), ...o,
})
const pages = new Map<string, string[] | null>([['a.pdf', ['nada', 'aqui dice Hola   Mundo']]])

describe('planImport', () => {
  it('reubica una cita en otra página y avisa', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab()] }]), pages, ex())
    expect(p.lessons[0].exercises[0].source).toMatchObject({ page: 2, verified: true })
    expect(p.warnings).toHaveLength(1)
  })
  it('cita inexistente: verified false y aviso', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab({ source: { file: 'a.pdf', page: 1, quote: 'zzz' } })] }]), pages, ex())
    expect(p.lessons[0].exercises[0].source).toMatchObject({ page: 1, verified: false })
    expect(p.unverified).toBe(1)
    expect(p.warnings).toHaveLength(1)
  })
  it('imagen no se verifica', () => {
    const m = mk([{ title: 'L', exercises: [ab({ source: { file: 'i.png', page: 1, quote: 'x' } })] }], [{ name: 'i.png', kind: 'imagen' }])
    const p = planImport(m, new Map([['i.png', null]]), ex())
    expect(p.lessons[0].exercises[0].source!.verified).toBeUndefined()
    expect(p.files[0].pages).toBeNull()
    expect(p.warnings).toEqual([])
  })
  it('lecciones nuevas siguen a las existentes', () => {
    const p = planImport(mk([{ title: 'A', exercises: [ab()] }, { title: 'B', exercises: [ab(), ab()] }]), pages, ex({ nextLessonPosition: 2 }))
    expect(p.lessons.map((l) => l.position)).toEqual([2, 3])
    expect(p.lessons[1].exercises.map((e) => e.position)).toEqual([0, 1])
  })
  it('lessonId agrega al final de esa lección', () => {
    const p = planImport(mk([{ lessonId: LID, exercises: [ab(), ab()] }]), pages, ex({ nextExercisePositionByLesson: new Map([[LID, 5]]) }))
    expect(p.lessons[0].exercises.map((e) => e.position)).toEqual([5, 6])
  })
  it('group por omisión concept:kind; conceptos existentes se reutilizan', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab(), ab({ group: 'g' })] }]), pages, ex({ conceptIds: new Map([['Uno', 'id1']]) }))
    expect(p.lessons[0].exercises.map((e) => e.variantGroup)).toEqual(['c1:abierta', 'g'])
    expect(p.newConcepts).toEqual([])
    expect(p.lessons[0].exercises[0].payload).not.toHaveProperty('concept')
  })
  it('source sin cita en PDF avisa', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab({ source: { file: 'a.pdf', page: 1 } })] }]), pages, ex())
    expect(p.warnings[0]).toMatch(/sin cita/)
    expect(p.lessons[0].exercises[0].source!.verified).toBeUndefined()
  })
})
