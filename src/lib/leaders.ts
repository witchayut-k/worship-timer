export function addLeaderToRoster(roster: string[], name: string): string[] {
  const trimmed = name.trim()
  if (!trimmed) return roster
  const exists = roster.some((n) => n.toLowerCase() === trimmed.toLowerCase())
  if (exists) return roster
  return [...roster, trimmed]
}

export function collectLeadersFromItems(
  roster: string[],
  leaderNames: string[],
): string[] {
  let next = [...roster]
  for (const name of leaderNames) {
    next = addLeaderToRoster(next, name)
  }
  return next
}
