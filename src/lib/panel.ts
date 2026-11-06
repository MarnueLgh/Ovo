const DAY = 86_400_000
const num = (day: string) => Date.parse(day + 'T00:00:00Z') / DAY
const day = (n: number) => new Date(n * DAY).toISOString().slice(0, 10)
const monday = (today: string) => num(today) - ((new Date(num(today) * DAY).getUTCDay() + 6) % 7)

/** Los 7 días (YYYY-MM-DD) de la semana de `today`, de lunes a domingo. */
export const weekOf = (today: string) => Array.from({ length: 7 }, (_, i) => day(monday(today) + i))

/** La semana anterior a la de `today`. */
export const lastWeekOf = (today: string) => weekOf(day(monday(today) - 7))

/** Cuadrícula de constancia: 53 semanas (columnas) × 7 días (lunes a domingo); null para los días posteriores a hoy. */
export function yearGrid(today: string): (string | null)[][] {
  const start = monday(today) - 52 * 7
  const end = num(today)
  return Array.from({ length: 53 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => (start + w * 7 + d <= end ? day(start + w * 7 + d) : null)),
  )
}

/** Intensidad de la celda según lecciones del día: 0, 1, 2, 3-4, 5+. */
export const heatLevel = (n: number) => (n <= 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : n < 5 ? 3 : 4)

/** "3 h 45 min", "12 min", "0 min". */
export function formatMinutes(ms: number) {
  const min = Math.round(ms / 60_000)
  const h = Math.floor(min / 60)
  return h ? `${h} h${min % 60 ? ` ${min % 60} min` : ''}` : `${min} min`
}
