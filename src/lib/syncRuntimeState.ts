import type { RuntimeState } from '../domain/types'
import { isOfflineEventId } from './eventSource'
import { writeRuntimeState } from './firestoreRepo'
import { publishLocalRuntime } from './localSync'

export async function syncRuntimeState(eventId: string, next: RuntimeState): Promise<RuntimeState> {
  const state: RuntimeState = {
    ...next,
    lastTickAtMs: Date.now(),
    version: next.version + 1,
  }

  if (isOfflineEventId(eventId)) {
    publishLocalRuntime(eventId, state)
    return state
  }

  await writeRuntimeState(eventId, state)
  return state
}
