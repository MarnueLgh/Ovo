import { describe, it, expect } from 'vitest'
import { computeNodeStates } from './path'

describe('computeNodeStates', () => {
  it('done, current, locked', () => {
    expect(computeNodeStates(['a', 'b', 'c'], new Set(['a']))).toEqual(['done', 'current', 'locked'])
  })
  it('todo completado', () => {
    expect(computeNodeStates(['a', 'b'], new Set(['a', 'b']))).toEqual(['done', 'done'])
  })
  it('vacío', () => {
    expect(computeNodeStates([], new Set())).toEqual([])
  })
})
