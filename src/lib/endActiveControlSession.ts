import { isOfflineEventId } from './eventSource'
import { loadRuntimeState, writeRuntimeState } from './firestoreRepo'
import { loadStoredLocalRuntime, publishLocalRuntime } from './localSync'
import { reduceRuntimeState } from './runtimeEngine'

export async function pauseRuntimeIfRunning(eventId: string): Promise<void> {
  try {
    const state = isOfflineEventId(eventId)
      ? loadStoredLocalRuntime(eventId)
      : await loadRuntimeState(eventId)
    if (!state || state.phase !== 'running') return

    const next = reduceRuntimeState(state, { type: 'pause', nowMs: Date.now() })
    if (isOfflineEventId(eventId)) {
      publishLocalRuntime(eventId, next)
    } else {
      await writeRuntimeState(eventId, next)
    }
  } catch {
    // still allow clearing active session if cloud/local write fails
  }
}
