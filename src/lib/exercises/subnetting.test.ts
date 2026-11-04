import { describe, it, expect } from 'vitest'
import { generateSubnetting, gradeSubnetting, explainSubnetting } from './subnetting'

const seq = (values: number[]) => {
  let i = 0
  return () => values[i++]
}

describe('subnetting', () => {
  it('genera 16 subredes con rand=0.99', () => {
    const p16 = generateSubnetting(() => 0.99)
    expect(p16.network).toBe('192.168.100.0/24')
    expect(p16.answer).toMatchObject({ prefix: '/28', mask: '255.255.255.240', magic: '16', hosts: '14' })
    expect(p16.answer.rows[1]).toEqual(['192.168.100.16', '192.168.100.17', '192.168.100.30', '192.168.100.31'])
  })

  it('genera 4 subredes con rand secuencial', () => {
    const p4 = generateSubnetting(seq([0.9, 0.0]))
    expect(p4.answer).toMatchObject({ prefix: '/26', mask: '255.255.255.192', magic: '64', hosts: '62' })
    expect(p4.answer.rows[2]).toEqual(['192.168.100.128', '192.168.100.129', '192.168.100.190', '192.168.100.191'])
  })

  it('acepta 26 o /26 y espacios', () => {
    const p4 = generateSubnetting(seq([0.9, 0.0]))
    const g = gradeSubnetting(p4.answer, { ...p4.answer, prefix: '26', mask: ' 255.255.255.192 ' })
    expect(g.correct).toBe(16)
    expect(g.score).toBe(1)
  })

  it('crédito parcial', () => {
    const p4 = generateSubnetting(seq([0.9, 0.0]))
    const bad = gradeSubnetting(p4.answer, {
      ...p4.answer,
      magic: '32',
      rows: [p4.answer.rows[0], p4.answer.rows[1], ['x', '', '', '']],
    })
    expect(bad.fields.magic).toBe(false)
    expect(bad.correct).toBe(11)
    expect(bad.score).toBeCloseTo(11 / 16)
  })

  it('la explicación usa los números del problema', () => {
    const p4 = generateSubnetting(seq([0.9, 0.0]))
    expect(explainSubnetting(p4).join(' ')).toContain('2^2 = 4')
  })

  it('acepta coma como separador decimal (teclado de iPhone)', () => {
    const p4 = generateSubnetting(seq([0.9, 0.0]))
    const r = gradeSubnetting(p4.answer, {
      ...p4.answer,
      mask: '255,255,255,192',
      rows: [p4.answer.rows[0], ['192,168,100,64', ...p4.answer.rows[1].slice(1)], p4.answer.rows[2]],
    })
    expect(r.fields.mask).toBe(true)
    expect(r.fields.r1c0).toBe(true)
    expect(r.correct).toBe(16)
  })
})
