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

/** Semanas (lunes a domingo) que cubren el mes `ym` (YYYY-MM); null fuera del mes. */
export function monthGrid(ym: string): (string | null)[][] {
  const first = num(ym + '-01')
  const [y, m] = ym.split('-').map(Number)
  const len = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const lead = (new Date(first * DAY).getUTCDay() + 6) % 7
  const cells = [...Array(lead).fill(null), ...Array.from({ length: len }, (_, i) => day(first + i))]
  while (cells.length % 7) cells.push(null)
  return Array.from({ length: cells.length / 7 }, (_, w) => cells.slice(w * 7, w * 7 + 7))
}

/** Mes siguiente o anterior: shiftMonth('2026-12', 1) → '2027-01'. */
export function shiftMonth(ym: string, by: number) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(Date.UTC(y, m - 1 + by, 1))
  return d.toISOString().slice(0, 7)
}

/** Días entre dos fechas YYYY-MM-DD. */
export const daysBetween = (from: string, to: string) => num(to) - num(from)
