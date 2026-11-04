export const normalizeForMatch = (s: string): string =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/-\r?\n/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const squash = (s: string) => normalizeForMatch(s).replace(/\s+/g, '')

/** Página (1-based) que contiene la cita: prueba la pista y luego las demás; cae a comparar sin espacios (unpdf a veces une los trozos sin espacios). */
export function findQuotePage(quote: string, pages: string[], hint: number): number | null {
  const q = normalizeForMatch(quote)
  if (!q) return null
  for (const [norm, needle] of [[normalizeForMatch, q], [squash, q.replace(/\s+/g, '')]] as const) {
    const has = (i: number) => i >= 0 && i < pages.length && norm(pages[i]).includes(needle)
    if (has(hint - 1)) return hint
    const i = pages.findIndex((_, k) => has(k))
    if (i !== -1) return i + 1
  }
  return null
}
