import { describe, it, expect } from 'vitest'
import { pickVariants } from './variants'

describe('pickVariants', () => {
  it('elige el menos visto, deja null y ordena', () => {
    const rows = [
      { id: 'a', group: 'g1', position: 0 },
      { id: 'b', group: 'g1', position: 1 },
      { id: 'c', group: null, position: 2 },
    ]
    expect(pickVariants(rows, new Map([['a', 2]])).map((r) => r.id)).toEqual(['b', 'c'])
  })
  it('empate: menor position', () => {
    const rows = [
      { id: 'b', group: 'g', position: 3 },
      { id: 'a', group: 'g', position: 1 },
    ]
    expect(pickVariants(rows, new Map()).map((r) => r.id)).toEqual(['a'])
  })
})
