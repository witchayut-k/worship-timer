import { decodeLocalPayload, type LocalPayload } from './localPayload'
import { isLibraryEventId, resolveLibraryPayload } from './localLibrary'

export function isOfflineEventId(eventId: string): boolean {
  return eventId.startsWith('local-') || isLibraryEventId(eventId)
}

export function resolveEventPayload(eventId: string): LocalPayload | null {
  const fromLibrary = resolveLibraryPayload(eventId)
  if (fromLibrary) return fromLibrary
  return decodeLocalPayload(eventId)
}
