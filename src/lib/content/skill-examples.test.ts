import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PackSchema } from './pack'

// Los ejemplos de la skill generar-unidad deben seguir siendo válidos para el esquema.
const skill = readFileSync('.claude/skills/generar-unidad/SKILL.md', 'utf8')
const blocks = (info: string) =>
  skill
    .split(/\r?\n/)
    .reduce<{ open: string | null; cur: string[]; out: string[] }>(
      (s, line) => {
        if (s.open === null && line.startsWith('```')) return { ...s, open: line.slice(3).trim(), cur: [] }
        if (s.open !== null && line.startsWith('```')) return { open: null, cur: [], out: s.open === info ? [...s.out, s.cur.join('\n')] : s.out }
        return s.open === null ? s : { ...s, cur: [...s.cur, line] }
      },
      { open: null, cur: [], out: [] },
    )
    .out.map((b) => JSON.parse(b))

describe('ejemplos de SKILL.md', () => {
  const ejercicios = blocks('json ejercicio')
  it('hay uno por tipo', () => {
    expect(ejercicios.map((e) => e.kind).sort()).toEqual(['abierta', 'calculo', 'caso_practico', 'dato_clave', 'relacionar'])
  })
  it.each(ejercicios.map((e) => [e.kind, e]))('%s es válido dentro de un paquete mínimo', (_k, e) => {
    const pack = {
      subject: 'Derecho informático',
      unit: { number: 1, title: 'Introducción' },
      files: [{ name: 'tema1.pdf', kind: 'pdf' }],
      concepts: [{ key: 'contrato', name: 'Contrato' }],
      lessons: [{ title: 'L', exercises: [e] }],
    }
    const r = PackSchema.safeParse(pack)
    expect(r.success ? [] : r.error.issues).toEqual([])
  })
  const tarjetas = blocks('json tarjeta')
  it('hay una tarjeta de estudio por tipo', () => {
    expect(tarjetas.map((e) => e.kind).sort()).toEqual(['comparacion', 'concepto', 'diagrama', 'flashcard', 'lista'])
  })
  it.each(tarjetas.map((e) => [e.kind, e]))('tarjeta %s es válida en una lección de estudio', (_k, e) => {
    const pack = {
      subject: 'Derecho informático',
      unit: { number: 1, title: 'Introducción' },
      files: [{ name: 'tema1.pdf', kind: 'pdf' }],
      concepts: [{ key: 'contrato', name: 'Contrato' }],
      lessons: [{ title: 'E', kind: 'estudio', section: 'Contratos', exercises: [e] }],
    }
    const r = PackSchema.safeParse(pack)
    expect(r.success ? [] : r.error.issues).toEqual([])
  })
  it('el paquete de ejemplo completo es válido', () => {
    const [full] = blocks('json')
    expect(PackSchema.safeParse(full).success).toBe(true)
  })
})
