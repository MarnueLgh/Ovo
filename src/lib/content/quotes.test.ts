import { describe, it, expect } from 'vitest'
import { normalizeForMatch, findQuotePage } from './quotes'

describe('quotes', () => {
  it('normaliza', () => expect(normalizeForMatch('Atenua-\nción  de la SEÑAL')).toBe('atenuacion de la senal'))
  it('encuentra página', () => {
    expect(findQuotePage('fibra monomodo', ['nada', 'La Fibra   monomodo usa…'], 1)).toBe(2)
    expect(findQuotePage('fibra', ['fibra', 'fibra'], 2)).toBe(2)
    expect(findQuotePage('no existe', ['a', 'b'], 1)).toBeNull()
  })
  it('cita vacía no coincide', () => {
    expect(findQuotePage('', ['a'], 1)).toBeNull()
    expect(findQuotePage('  \n ', ['a'], 1)).toBeNull()
  })
  it('ligaduras, CRLF y acentos', () => {
    expect(findQuotePage('fibra', ['la ﬁbra'], 1)).toBe(1)
    expect(findQuotePage('atenua-\r\nción', ['la atenuación'], 1)).toBe(1)
    expect(findQuotePage('atenuación', ['la atenuacion'], 1)).toBe(1)
  })
  it('sin espacios: unpdf puede unir trozos', () => {
    expect(findQuotePage('la fibra monomodo', ['nada', 'lafibramonomodo usa luz'], 1)).toBe(2)
    expect(findQuotePage('la fibra monomodo', ['lafibramonomodo', 'la fibra monomodo'], 2)).toBe(2) // exacto antes que el fallback
  })
})
