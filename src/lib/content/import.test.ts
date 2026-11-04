import { describe, expect, it } from 'vitest'
import { planImport, summarize, type Existing } from './import'
import { PackSchema } from './pack'

const LID = '11111111-1111-4111-8111-111111111111'
const ab = (extra = {}) => ({
  kind: 'abierta', question: 'q', modelAnswer: 'a', keyPoints: ['x', 'y'], concept: 'c1',
  source: { file: 'a.pdf', page: 1, quote: 'dice hola mundo' }, ...extra,
})
const mk = (lessons: unknown[], files = [{ name: 'a.pdf', kind: 'pdf' }]) =>
  PackSchema.parse({
    subject: 'S', unit: { number: 9, title: 'U' }, files,
    concepts: [{ key: 'c1', name: 'Uno' }], lessons,
  })
const ex = (o: Partial<Existing> = {}): Existing => ({
  nextLessonPosition: 0, conceptIds: new Map(), nextExercisePositionByLesson: new Map(), ...o,
})
const warn = (p: { warnings: string[] }) => p.warnings.filter((w) => !/por partida/.test(w))
const pages = new Map<string, string[] | null>([['a.pdf', ['nada', 'aqui dice Hola   Mundo']]])

describe('planImport', () => {
  it('reubica una cita en otra página y avisa', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab()] }]), pages, ex())
    expect(p.lessons[0].exercises[0].source).toMatchObject({ page: 2, verified: true })
    expect(warn(p)).toHaveLength(1)
  })
  it('cita inexistente: verified false y aviso', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab({ source: { file: 'a.pdf', page: 1, quote: 'zzz yyy xxx' } })] }]), pages, ex())
    expect(p.lessons[0].exercises[0].source).toMatchObject({ page: 1, verified: false })
    expect(p.unverified).toBe(1)
    expect(warn(p)).toHaveLength(1)
  })
  it('imagen no se verifica', () => {
    const m = mk([{ title: 'L', exercises: [ab({ source: { file: 'i.png', page: 1, quote: 'una cita larga' } })] }], [{ name: 'i.png', kind: 'imagen' }])
    const p = planImport(m, new Map([['i.png', null]]), ex())
    expect(p.lessons[0].exercises[0].source!.verified).toBeUndefined()
    expect(p.files[0].pages).toBeNull()
    expect(warn(p)).toEqual([])
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
    expect(p.lessons[0].exercises.map((e) => e.variantGroup)).toEqual(['uno:abierta', 'g'])
    expect(p.newConcepts).toEqual([])
    expect(p.lessons[0].exercises[0].payload).not.toHaveProperty('concept')
  })
  it('group por omisión usa el nombre del concepto, no la clave', () => {
    const m = (key: string) => PackSchema.parse({ subject: 'S', unit: { number: 9, title: 'U' }, files: [{ name: 'a.pdf', kind: 'pdf' }],
      concepts: [{ key, name: 'Modelo OSI' }], lessons: [{ title: 'L', exercises: [ab({ concept: key })] }] })
    const g = (k: string) => planImport(m(k), pages, ex()).lessons[0].exercises[0].variantGroup
    expect(g('a')).toBe(g('zzz'))
    expect(g('a')).toBe('modelo osi:abierta')
  })
  it('cita ya en su página: verified sin aviso', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab({ source: { file: 'a.pdf', page: 2, quote: 'dice hola mundo' } })] }]), pages, ex())
    expect(p.lessons[0].exercises[0].source).toMatchObject({ page: 2, verified: true })
    expect(warn(p)).toEqual([])
  })
  it('mismo lessonId en dos bloques continúa posiciones; lessonId desconocido falla', () => {
    const e = ex({ nextExercisePositionByLesson: new Map([[LID, 3]]) })
    const p = planImport(mk([{ lessonId: LID, exercises: [ab(), ab()] }, { lessonId: LID, exercises: [ab()] }]), pages, e)
    expect([...p.lessons[0].exercises, ...p.lessons[1].exercises].map((x) => x.position)).toEqual([3, 4, 5])
    expect(() => planImport(mk([{ lessonId: LID, exercises: [ab()] }]), pages, ex())).toThrow()
  })
  it('verified del paquete nunca se copia', () => {
    const m = mk([{ title: 'L', exercises: [ab({ source: { file: 'i.png', page: 1, quote: 'una cita larga', verified: true } })] }], [{ name: 'i.png', kind: 'imagen' }])
    const p = planImport(m, new Map([['i.png', null]]), ex())
    expect(p.lessons[0].exercises[0].source).not.toHaveProperty('verified')
  })
  it('página sin texto: ni se reubica ni se marca falsa, y se cuenta aparte', () => {
    const scan = new Map<string, string[] | null>([['a.pdf', ['  ', 'hola mundo']]])
    const p = planImport(mk([{ title: 'L', exercises: [ab()] }]), scan, ex())
    expect(p.lessons[0].exercises[0].source).toMatchObject({ page: 1 })
    expect(p.lessons[0].exercises[0].source!.verified).toBeUndefined()
    expect(p.unverifiable).toBe(1)
    expect(p.unverified).toBe(0)
    expect(p.warnings.join(' | ')).toContain('página 1 de a.pdf sin texto seleccionable: la cita no se puede verificar')
  })
  it('página mayor que el PDF: error con ruta', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab({ source: { file: 'a.pdf', page: 3, quote: 'dice hola mundo' } })] }]), pages, ex())
    expect(p.errors).toHaveLength(1)
    expect(p.errors[0]).toContain('lessons.0.exercises.0.source.page')
  })
  it('cita de menos de 3 palabras avisa', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab({ source: { file: 'a.pdf', page: 2, quote: 'hola mundo' } })] }]), pages, ex())
    expect(p.warnings.join(' | ')).toMatch(/menos de 3 palabras/)
    const q = planImport(mk([{ title: 'L', exercises: [ab({ source: { file: 'a.pdf', page: 2, quote: 'aqui dice Hola' } })] }]), pages, ex())
    expect(q.warnings).toEqual(expect.not.arrayContaining([expect.stringMatching(/menos de 3/)]))
  })
  it('ejercicios por partida = grupos distintos; avisa si hay menos de 6', () => {
    const p = planImport(mk([{ title: 'L', exercises: [ab(), ab(), ab({ group: 'g' })] }]), pages, ex())
    expect(p.lessons[0].groups).toBe(2)
    expect(p.warnings.join(' | ')).toContain('Lección "L": solo 2 ejercicios por partida')
    const six = Array.from({ length: 6 }, (_, i) => ab({ group: `g${i}`, source: { file: 'a.pdf', page: 2, quote: 'aqui dice Hola Mundo' } }))
    expect(planImport(mk([{ title: 'L', exercises: six }]), pages, ex()).warnings.join('')).not.toMatch(/por partida/)
  })
  it('un reportado del mismo grupo por cada ejercicio nuevo', () => {
    const reported = [{ id: 'r1', lessonId: LID, group: 'uno:abierta' }, { id: 'r2', lessonId: LID, group: 'otro' }]
    const p = planImport(mk([{ lessonId: LID, exercises: [ab(), ab({ group: 'zzz' })] }]), pages,
      ex({ nextExercisePositionByLesson: new Map([[LID, 1]]), reported }))
    expect(p.clearReported).toEqual(['r1'])
    expect(p.warnings.join(' | ')).toContain('"zzz" no reemplaza a ningún reportado')
  })
  it('títulos repetidos y lecciones existentes', () => {
    const p = planImport(mk([{ title: 'Ya Existe', exercises: [ab()] }, { title: 'Nueva', exercises: [ab()] }]), pages, ex({ lessonTitles: ['ya existe', 'Otra'] }))
    expect(p.duplicateTitles).toEqual(['Ya Existe'])
    expect(p.existingLessons).toBe(2)
  })
  it('resumen con singular/plural, ejercicios por partida y no verificables', () => {
    const scan = new Map<string, string[] | null>([['a.pdf', ['  ', 'hola mundo']]])
    const p = planImport(mk([{ title: 'L', exercises: [ab(), ab({ group: 'g' })] }]), scan, ex())
    expect(summarize(p)).toEqual([
      'Unidad 9 · 1 lección nueva · 2 ejercicios · 0 citas sin verificar · 2 citas no verificables (sin texto)',
      '  L: 2 ejercicios por partida (2 en total)',
    ])
    const q = planImport(mk([{ title: 'L', exercises: [ab({ source: { file: 'a.pdf', page: 1, quote: 'zzz yyy xxx' } })] }, { title: 'M', exercises: [ab()] }]), pages, ex())
    expect(summarize(q)[0]).toBe('Unidad 9 · 2 lecciones nuevas · 2 ejercicios · 1 cita sin verificar')
    expect(summarize(q)[1]).toBe('  L: 1 ejercicio por partida (1 en total)')
  })
})
