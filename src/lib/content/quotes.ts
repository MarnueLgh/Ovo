export const normalizeForMatch = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/-\n/g, '')
    .replace(/\s+/g, ' ')
    .trim()

export function findQuotePage(quote: string, pages: string[], hint: number): number | null {
  const q = normalizeForMatch(quote)
  const has = (i: number) => i >= 0 && i < pages.length && normalizeForMatch(pages[i]).includes(q)
  if (has(hint - 1)) return hint
  const i = pages.findIndex((_, k) => has(k))
  return i === -1 ? null : i + 1
}
