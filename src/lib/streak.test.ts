import { describe, it, expect } from 'vitest'
import { toLocalDay } from './time'
import { computeStreak } from './streak'

describe('toLocalDay', () => {
  it('usa la zona de CDMX', () => {
    expect(toLocalDay(new Date('2026-11-04T05:30:00Z'))).toBe('2026-11-03')
    expect(toLocalDay(new Date('2026-11-04T06:10:00Z'))).toBe('2026-11-04')
  })
})

describe('computeStreak', () => {
  it('racha que incluye hoy', () => {
    expect(computeStreak(['2026-11-01', '2026-11-02', '2026-11-03'], '2026-11-03')).toEqual({ current: 3, best: 3 })
  })
  it('hoy aún no cuenta si ayer sí', () => {
    expect(computeStreak(['2026-11-01', '2026-11-02'], '2026-11-03')).toEqual({ current: 2, best: 2 })
  })
  it('racha rota', () => {
    expect(computeStreak(['2026-10-01', '2026-10-02', '2026-10-03', '2026-11-02'], '2026-11-04')).toEqual({ current: 0, best: 3 })
  })
  it('vacío', () => {
    expect(computeStreak([], '2026-11-03')).toEqual({ current: 0, best: 0 })
  })
  it('ignora duplicados y desorden', () => {
    expect(computeStreak(['2026-11-03', '2026-11-02', '2026-11-03'], '2026-11-03')).toEqual({ current: 2, best: 2 })
  })
})
