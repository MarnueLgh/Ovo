import { describe, expect, it } from 'vitest'
import { effectiveGroup, matchReplacements } from './reportados'

describe('effectiveGroup', () => {
  it('el grupo guardado, o concepto normalizado:tipo', () => {
    expect(effectiveGroup({ variantGroup: 'x', conceptName: 'C', kind: 'abierta' })).toBe('x')
    expect(effectiveGroup({ variantGroup: null, conceptName: 'Modelo OSI', kind: 'abierta' })).toBe('modelo osi:abierta')
    expect(effectiveGroup({ variantGroup: null, conceptName: null, kind: 'abierta' })).toBe(':abierta')
  })
})

describe('matchReplacements', () => {
  const rep = [
    { id: 'a', lessonId: 'L1', group: 'g' },
    { id: 'b', lessonId: 'L1', group: 'g' },
    { id: 'c', lessonId: 'L2', group: 'g' },
  ]
  it('uno por ejercicio nuevo, misma lección y grupo', () => {
    expect(matchReplacements(rep, [{ lessonId: 'L1', group: 'g' }]).clear).toEqual(['a'])
    expect(matchReplacements(rep, [{ lessonId: 'L1', group: 'g' }, { lessonId: 'L1', group: 'g' }]).clear).toEqual(['a', 'b'])
  })
  it('no reutiliza y reporta los que no reemplazan nada', () => {
    const r = matchReplacements(rep, [{ lessonId: 'L1', group: 'g' }, { lessonId: 'L1', group: 'g' }, { lessonId: 'L1', group: 'g' }, { lessonId: 'L2', group: 'otro' }])
    expect(r.clear).toEqual(['a', 'b'])
    expect(r.unmatched).toEqual([2, 3])
  })
})
