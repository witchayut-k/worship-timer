export type SegmentLines = {
  kicker: string
  segment: string
  leader: string | null
}

export function currentSegmentLines(name: string, leader: string): SegmentLines {
  const segment = name.trim().toUpperCase() || '—'
  const lead = leader.trim().toUpperCase()
  return {
    kicker: 'CURRENT SEGMENT',
    segment,
    leader: lead || null,
  }
}

export function nextSegmentLines(name: string | null, leader: string | null): SegmentLines {
  if (!name?.trim()) {
    return { kicker: 'NEXT UP', segment: '—', leader: null }
  }
  const segment = name.trim().toUpperCase()
  const nextLead = leader?.trim().toUpperCase()
  return {
    kicker: 'NEXT UP',
    segment,
    leader: nextLead || null,
  }
}
