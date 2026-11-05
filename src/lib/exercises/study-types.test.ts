import { describe, expect, it } from 'vitest'
import { isStudyKind, parsePayload } from './types'

describe('tarjetas de estudio', () => {
  it('acepta los cinco tipos válidos', () => {
    expect(parsePayload({ kind: 'concepto', title: 'AFI', body: 'Uno.\n\nDos.', bullets: ['a'] }).kind).toBe('concepto')
    expect(parsePayload({ kind: 'flashcard', front: '¿Qué es?', back: 'Esto' }).kind).toBe('flashcard')
    expect(parsePayload({ kind: 'comparacion', title: 'A vs B', columns: ['A', 'B'], rows: [{ label: 'x', cells: ['1', '2'] }] }).kind).toBe('comparacion')
    expect(parsePayload({ kind: 'diagrama', title: 'Pasos', layout: 'proceso', nodes: [{ label: '1' }, { label: '2' }] }).kind).toBe('diagrama')
    expect(parsePayload({ kind: 'lista', title: 'Causas', items: ['a', 'b'] }).kind).toBe('lista')
  })

  it('comparación con celdas mal contadas se rechaza', () => {
    expect(() => parsePayload({ kind: 'comparacion', title: 't', columns: ['A', 'B'], rows: [{ label: 'x', cells: ['1'] }] })).toThrow()
  })

  it('children solo en jerarquía y máximo 3 niveles', () => {
    expect(() => parsePayload({ kind: 'diagrama', title: 't', layout: 'proceso', nodes: [{ label: 'a', children: [{ label: 'b' }] }, { label: 'c' }] })).toThrow()
    const n = (d: number): object => (d === 1 ? { label: 'h' } : { label: 'n', children: [n(d - 1)] })
    expect(parsePayload({ kind: 'diagrama', title: 't', layout: 'jerarquia', nodes: [n(3)] }).kind).toBe('diagrama')
    expect(() => parsePayload({ kind: 'diagrama', title: 't', layout: 'jerarquia', nodes: [n(4)] })).toThrow()
  })

  it('proceso necesita al menos 2 nodos; lista al menos 2 elementos', () => {
    expect(() => parsePayload({ kind: 'diagrama', title: 't', layout: 'ciclo', nodes: [{ label: 'a' }] })).toThrow()
    expect(() => parsePayload({ kind: 'lista', title: 't', items: ['a'] })).toThrow()
  })

  it('isStudyKind distingue estudio de práctica', () => {
    expect(isStudyKind('flashcard')).toBe(true)
    expect(isStudyKind('caso_practico')).toBe(false)
  })
})
