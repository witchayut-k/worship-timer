import type { ProgramItem, WorshipEvent } from '../domain/types'
import { resolveEventSettings } from '../domain/types'

export type LocalPayload = {
  event: WorshipEvent
  items: ProgramItem[]
}

export function encodeLocalEventId(payload: LocalPayload): string {
  const normalized: LocalPayload = {
    event: {
      ...payload.event,
      settings: resolveEventSettings(payload.event),
      leaderNames: payload.event.leaderNames ?? [],
    },
    items: payload.items,
  }
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(normalized))))
  return `local-${encoded}`
}

export function decodeLocalPayload(eventId: string): LocalPayload | null {
  if (!eventId.startsWith('local-')) return null
  const encoded = eventId.slice('local-'.length)
  try {
    const json = decodeURIComponent(escape(atob(encoded)))
    const parsed = JSON.parse(json) as LocalPayload
    return {
      event: {
        ...parsed.event,
        settings: resolveEventSettings(parsed.event),
        leaderNames: parsed.event.leaderNames ?? [],
      },
      items: parsed.items,
    }
  } catch {
    return null
  }
}
