import { isOfflineEventId } from './eventSource'
import { loadRuntimeState, writeRuntimeState } from './firestoreRepo'
import { loadStoredLocalRuntime, publishLocalRuntime } from './localSync'
import { reduceRuntimeState } from './runtimeEngine'

export { pauseRuntimeIfRunning } from './endActiveControlSession'

export async function startRuntime(eventId: string): Promise<void> {
  try {
    const state = isOfflineEventId(eventId)
      ? loadStoredLocalRuntime(eventId)
      : await loadRuntimeState(eventId)
    if (!state || state.phase === 'running') return

    const next = reduceRuntimeState(state, { type: 'start', nowMs: Date.now() })
    if (isOfflineEventId(eventId)) {
      publishLocalRuntime(eventId, next)
    } else {
      await writeRuntimeState(eventId, next)
    }
  } catch {
    // allow UI to continue if write fails
  }
}
