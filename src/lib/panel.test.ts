import { describe, it, expect } from 'vitest'
import { formatMinutes, heatLevel, lastWeekOf, weekOf, yearGrid } from './panel'

describe('panel', () => {
  it('semana de lunes a domingo', () => {
    // 2026-11-05 es jueves
    expect(weekOf('2026-11-05')).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    expect(weekOf('2026-11-08')[0]).toBe('2026-11-02') // domingo sigue en la misma semana
    expect(weekOf('2026-11-02')[0]).toBe('2026-11-02')
    expect(lastWeekOf('2026-11-05')[0]).toBe('2026-10-26')
  })
  it('cuadrícula del año termina hoy', () => {
    const g = yearGrid('2026-11-05')
    expect(g).toHaveLength(53)
    expect(g[52]).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', null, null, null])
    expect(g[0][0]).toBe('2025-11-03')
  })
  it('niveles y minutos', () => {
    expect([0, 1, 2, 3, 4, 5, 9].map(heatLevel)).toEqual([0, 1, 2, 3, 3, 4, 4])
    expect(formatMinutes(225 * 60_000)).toBe('3 h 45 min')
    expect(formatMinutes(120 * 60_000)).toBe('2 h')
    expect(formatMinutes(29_000)).toBe('0 min')
  })
})
