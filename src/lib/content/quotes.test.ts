import { describe, it, expect } from 'vitest'
import { normalizeForMatch, findQuotePage } from './quotes'

describe('quotes', () => {
  it('normaliza', () => expect(normalizeForMatch('Atenua-\nción  de la SEÑAL')).toBe('atenuacion de la senal'))
  it('encuentra página', () => {
    expect(findQuotePage('fibra monomodo', ['nada', 'La Fibra   monomodo usa…'], 1)).toBe(2)
    expect(findQuotePage('fibra', ['fibra', 'fibra'], 2)).toBe(2)
    expect(findQuotePage('no existe', ['a', 'b'], 1)).toBeNull()
  })
})
