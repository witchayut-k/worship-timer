import { isControlLeaseEnabled } from '../config/app.config'
import { getAuthClient, hasFirebaseConfig } from './firebase'
import { isOfflineEventId } from './eventSource'
import {
  getOrCreateControlLeaseSessionId,
  releaseControlLease,
} from './controlLease'
import { loadRuntimeState, writeRuntimeState } from './firestoreRepo'
import { loadStoredLocalRuntime, publishLocalRuntime } from './localSync'
import { reduceRuntimeState } from './runtimeEngine'

export async function releaseControlLeaseForEvent(eventId: string): Promise<void> {
  if (!isControlLeaseEnabled() || isOfflineEventId(eventId) || !hasFirebaseConfig()) return
  try {
    const uid = getAuthClient().currentUser?.uid
    if (!uid) return
    const sessionId = getOrCreateControlLeaseSessionId(eventId)
    await releaseControlLease(eventId, uid, sessionId)
  } catch {
    // best-effort
  }
}

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

export async function endActiveControlSession(eventId: string): Promise<void> {
  await releaseControlLeaseForEvent(eventId)
  await pauseRuntimeIfRunning(eventId)
}
