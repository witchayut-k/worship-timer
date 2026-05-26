import type { EventDoc } from './types'

export type ServiceListEntry = EventDoc & {
  itemCount?: number
}

export type ServiceDateGroup = {
  date: string
  label: string
  sessions: ServiceListEntry[]
}

const dateLabelFmt = new Intl.DateTimeFormat('th-TH', {
  weekday: 'long',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatServiceDateLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return dateLabelFmt.format(new Date(y, m - 1, d))
}

export function sortServiceEntries(entries: ServiceListEntry[]): ServiceListEntry[] {
  return [...entries].sort((a, b) => {
    const dateCmp = b.data.date.localeCompare(a.data.date)
    if (dateCmp !== 0) return dateCmp
    return b.data.updatedAtMs - a.data.updatedAtMs
  })
}

export function groupServicesByDate(entries: ServiceListEntry[]): ServiceDateGroup[] {
  const sorted = sortServiceEntries(entries)
  const groups: ServiceDateGroup[] = []

  for (const entry of sorted) {
    const last = groups[groups.length - 1]
    if (last?.date === entry.data.date) {
      last.sessions.push(entry)
    } else {
      groups.push({
        date: entry.data.date,
        label: formatServiceDateLabel(entry.data.date),
        sessions: [entry],
      })
    }
  }

  for (const group of groups) {
    group.sessions.sort((a, b) => b.data.updatedAtMs - a.data.updatedAtMs)
  }

  return groups
}

export function filterServiceEntries(
  entries: ServiceListEntry[],
  query: string,
): ServiceListEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (e) =>
      e.data.title.toLowerCase().includes(q) ||
      e.data.date.includes(q) ||
      formatServiceDateLabel(e.data.date).toLowerCase().includes(q),
  )
}
