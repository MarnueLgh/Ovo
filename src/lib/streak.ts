const DAY = 86_400_000
const num = (day: string) => Date.parse(day + 'T00:00:00Z') / DAY

export function computeStreak(activeDays: string[], today: string): { current: number; best: number } {
  const days = [...new Set(activeDays)].sort().map(num)
  if (!days.length) return { current: 0, best: 0 }

  let best = 1
  let run = 1
  for (let i = 1; i < days.length; i++) {
    run = days[i] - days[i - 1] === 1 ? run + 1 : 1
    best = Math.max(best, run)
  }

  // La racha vigente termina hoy o ayer; run ya es la racha que termina en el último día activo.
  const gap = num(today) - days[days.length - 1]
  return { current: gap === 0 || gap === 1 ? run : 0, best }
}
