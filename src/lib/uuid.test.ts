import { describe, it, expect } from 'vitest'
import { isUuid } from './uuid'

describe('isUuid', () => {
  it('acepta uuid y rechaza el resto', () => {
    expect(isUuid('538f0119-1077-4fb9-a7a0-5be58f553831')).toBe(true)
    expect(isUuid('abc')).toBe(false)
    expect(isUuid('538f0119-1077-4fb9-a7a0-5be58f55383')).toBe(false)
    expect(isUuid('')).toBe(false)
  })
})
