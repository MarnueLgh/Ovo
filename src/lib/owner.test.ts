import { describe, expect, it } from 'vitest'
import { isOwner } from './owner'

describe('isOwner', () => {
  it('compara sin mayúsculas ni espacios', () => expect(isOwner(' Yo@Mail.com ', 'yo@mail.COM ')).toBe(true))
  it('rechaza otros correos', () => expect(isOwner('otro@mail.com', 'yo@mail.com')).toBe(false))
  it('niega todo si OVO_EMAIL falta o está vacío', () => {
    expect(isOwner('yo@mail.com', undefined)).toBe(false)
    expect(isOwner('yo@mail.com', '  ')).toBe(false)
  })
  it('rechaza correo ausente', () => expect(isOwner(undefined, 'yo@mail.com')).toBe(false))
})
