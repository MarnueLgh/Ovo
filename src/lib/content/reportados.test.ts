import { describe, expect, it } from 'vitest'
import { replacementKey, withoutReplacement } from './reportados'

describe('withoutReplacement', () => {
  const rep = [{ id: 'a', lessonId: 'L1', key: 'g' }, { id: 'b', lessonId: 'L2', key: 'g' }]
  it('quita los que tienen un activo con la misma lección y clave', () => {
    expect(withoutReplacement(rep, [{ lessonId: 'L1', key: 'g' }]).map((r) => r.id)).toEqual(['b'])
  })
  it('sin activos, todos quedan', () => expect(withoutReplacement(rep, [])).toHaveLength(2))
  it('clave por defecto: grupo o concepto:tipo', () => {
    expect(replacementKey({ variantGroup: 'x', conceptId: 'c', kind: 'abierta' })).toBe('x')
    expect(replacementKey({ variantGroup: null, conceptId: 'c', kind: 'abierta' })).toBe('c:abierta')
  })
})
