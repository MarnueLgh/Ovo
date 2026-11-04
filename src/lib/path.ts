export type NodeState = 'done' | 'current' | 'locked'

export function computeNodeStates(lessonIds: string[], completedIds: Set<string>): NodeState[] {
  let currentSeen = false
  return lessonIds.map((id) => {
    if (completedIds.has(id)) return 'done'
    if (currentSeen) return 'locked'
    currentSeen = true
    return 'current'
  })
}
