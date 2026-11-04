export function pickVariants<T extends { id: string; group: string | null; position: number }>(
  rows: T[],
  seen: Map<string, number>,
): T[] {
  const best = new Map<string, T>()
  const out: T[] = []
  const n = (r: T) => seen.get(r.id) ?? 0
  for (const r of rows) {
    if (r.group === null) {
      out.push(r)
      continue
    }
    const cur = best.get(r.group)
    if (!cur || n(r) < n(cur) || (n(r) === n(cur) && r.position < cur.position)) best.set(r.group, r)
  }
  return [...out, ...best.values()].sort((a, b) => a.position - b.position)
}
