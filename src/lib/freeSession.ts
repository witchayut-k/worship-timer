import type { ProgramItem, WorshipEvent } from '../domain/types'
import { DEFAULT_EVENT_DISPLAY_SETTINGS } from '../domain/types'
import { getLocalEvent, isLibraryEventId, upsertLocalEvent } from './localLibrary'

/** Fixed local slot for Free plan (single session, overwrite only). */
export const FREE_SESSION_ID = 'lib-free-slot'

export function isFreeSessionId(eventId: string): boolean {
  return eventId === FREE_SESSION_ID
}

export function freeSessionSetupPath(): string {
  return `/setup/${FREE_SESSION_ID}`
}

export function freeSessionControlPath(): string {
  return `/start/${FREE_SESSION_ID}`
}

export function ensureFreeSession(): { id: string; event: WorshipEvent; items: ProgramItem[] } {
  const existing = getLocalEvent(FREE_SESSION_ID)
  if (existing) {
    return { id: existing.id, event: existing.event, items: existing.items }
  }
  const event: WorshipEvent = {
    title: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'active',
    updatedAtMs: Date.now(),
    settings: { ...DEFAULT_EVENT_DISPLAY_SETTINGS },
    leaderNames: [],
  }
  upsertLocalEvent({ id: FREE_SESSION_ID, event, items: [] })
  return { id: FREE_SESSION_ID, event, items: [] }
}

export function coerceFreeSessionEventId(eventId: string | undefined): string {
  if (!eventId || !isLibraryEventId(eventId)) return FREE_SESSION_ID
  return FREE_SESSION_ID
}
