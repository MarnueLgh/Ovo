import { describe, expect, it } from 'vitest'
import { planImport, summarize, uncoveredPages, type Existing } from './import'
import { PackSchema } from './pack'

const src = (page: number, quote = 'aqui dice hola mundo') => ({ file: 'a.pdf', page, quote })
const card = (page: number) => ({ kind: 'flashcard', front: 'f', back: 'b', concept: 'c1', source: src(page) })
const ab = { kind: 'abierta', question: 'q', modelAnswer: 'a', keyPoints: ['x', 'y'], concept: 'c1', source: src(2) }
const pack = (lessons: unknown[]) => ({
  subject: 'S', unit: { number: 9, title: 'U' }, files: [{ name: 'a.pdf', kind: 'pdf' }],
  concepts: [{ key: 'c1', name: 'Uno' }], lessons,
})
const ex = (): Existing => ({ nextLessonPosition: 0, conceptIds: new Map(), nextExercisePositionByLesson: new Map() })
const pages = new Map<string, string[] | null>([['a.pdf', ['', 'aqui dice Hola Mundo', 'otra pagina con texto', 'mas texto aqui']]])

describe('subsecciones de estudio', () => {
  it('uncoveredPages ignora páginas vacías y las citadas', () => {
    expect(uncoveredPages(['', 'a', 'b', '  \n '], new Set([2]))).toEqual([3])
  })

  it('estudio solo admite tarjetas; práctica no admite tarjetas', () => {
    expect(PackSchema.safeParse(pack([{ title: 'E', kind: 'estudio', exercises: [ab] }])).success).toBe(false)
    expect(PackSchema.safeParse(pack([{ title: 'P', exercises: [card(2)] }])).success).toBe(false)
    expect(PackSchema.safeParse(pack([{ title: 'E', kind: 'estudio', exercises: [card(2)] }])).success).toBe(true)
  })

  it('si una lección tiene section, todas las nuevas la necesitan', () => {
    const r = PackSchema.safeParse(pack([
      { title: 'E', kind: 'estudio', section: 'Tema', exercises: [card(2)] },
      { title: 'P', exercises: [ab] },
    ]))
    expect(r.success).toBe(false)
  })

  it('un estudio con muchas tarjetas del mismo concepto no se agrupa ni se limita a 12 grupos', () => {
    const many = Array.from({ length: 20 }, () => card(2))
    const p = planImport(PackSchema.parse(pack([{ title: 'E', kind: 'estudio', section: 'T', exercises: many }])), pages, ex())
    expect(p.lessons[0].exercises.every((e) => e.variantGroup === null)).toBe(true)
    expect(p.lessons[0].groups).toBe(20)
  })

  it('secciones en orden, cobertura y resumen', () => {
    const p = planImport(PackSchema.parse(pack([
      { title: 'E1', kind: 'estudio', section: 'Tema A', exercises: [card(2)] },
      { title: 'P1', section: 'Tema A', exercises: [ab] },
      { title: 'E2', kind: 'estudio', section: 'Tema B', exercises: [{ ...card(3), source: src(3, 'otra pagina con texto') }] },
    ])), pages, ex())
    expect(p.sections).toEqual(['Tema A', 'Tema B'])
    expect(p.lessons.map((l) => l.kind)).toEqual(['estudio', 'practica', 'estudio'])
    expect(p.coverage).toEqual([{ file: 'a.pdf', pages: [4] }]) // p.1 vacía no cuenta; 2 y 3 citadas
    expect(p.warnings.some((w) => /cobertura: a\.pdf páginas sin estudiar: 4/.test(w))).toBe(true)
    const s = summarize(p).join('\n')
    expect(s).toMatch(/2 subsecciones/)
    expect(s).toMatch(/2 tarjetas de estudio/)
    expect(s).toMatch(/\[Tema A\] E1 \(estudio\): 1 tarjeta/)
  })

  it('un paquete sin estudio no calcula cobertura', () => {
    const p = planImport(PackSchema.parse(pack([{ title: 'P', exercises: [ab] }])), pages, ex())
    expect(p.coverage).toEqual([])
  })
})
