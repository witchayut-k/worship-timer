import type { AppLocale } from '../i18n/types'
import { toIntlLocale } from '../i18n/translate'
import type { EventDoc } from './types'

export type ServiceListEntry = EventDoc & {
  itemCount?: number
}

export type ServiceDateGroup = {
  date: string
  label: string
  sessions: ServiceListEntry[]
}

function createDateLabelFmt(locale: AppLocale) {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatServiceDateLabel(date: string, locale: AppLocale = 'en'): string {
  const [y, m, d] = date.split('-').map(Number)
  if (!y || !m || !d) return date
  return createDateLabelFmt(locale).format(new Date(y, m - 1, d))
}

export function sortServiceEntries(entries: ServiceListEntry[]): ServiceListEntry[] {
  return [...entries].sort((a, b) => {
    const dateCmp = b.data.date.localeCompare(a.data.date)
    if (dateCmp !== 0) return dateCmp
    return b.data.updatedAtMs - a.data.updatedAtMs
  })
}

export function groupServicesByDate(
  entries: ServiceListEntry[],
  locale: AppLocale = 'en',
): ServiceDateGroup[] {
  const sorted = sortServiceEntries(entries)
  const groups: ServiceDateGroup[] = []

  for (const entry of sorted) {
    const last = groups[groups.length - 1]
    if (last?.date === entry.data.date) {
      last.sessions.push(entry)
    } else {
      groups.push({
        date: entry.data.date,
        label: formatServiceDateLabel(entry.data.date, locale),
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
  locale: AppLocale = 'en',
): ServiceListEntry[] {
  const q = query.trim().toLowerCase()
  if (!q) return entries
  return entries.filter(
    (e) =>
      e.data.title.toLowerCase().includes(q) ||
      e.data.date.includes(q) ||
      formatServiceDateLabel(e.data.date, locale).toLowerCase().includes(q),
  )
}
