import type { RuntimePhase } from '../domain/types'
import { isOfflineEventId } from './eventSource'
import { hasFirebaseConfig } from './firebase'
import { loadStoredLocalRuntime } from './localSync'

export type RuntimePhaseSnapshot = {
  phase: RuntimePhase | null
  ready: boolean
}

const cache = new Map<string, { phase: RuntimePhase; ready: true }>()

export function readRuntimePhaseSnapshot(eventId: string | null | undefined): RuntimePhaseSnapshot {
  if (!eventId) return { phase: null, ready: false }

  const cached = cache.get(eventId)
  if (cached) return cached

  if (isOfflineEventId(eventId)) {
    const stored = loadStoredLocalRuntime(eventId)
    const phase = stored?.phase ?? 'stopped'
    const snapshot = { phase, ready: true as const }
    cache.set(eventId, snapshot)
    return snapshot
  }

  if (!hasFirebaseConfig()) {
    const snapshot = { phase: 'stopped' as RuntimePhase, ready: true as const }
    cache.set(eventId, snapshot)
    return snapshot
  }

  return { phase: null, ready: false }
}

export function writeRuntimePhaseCache(eventId: string, phase: RuntimePhase) {
  cache.set(eventId, { phase, ready: true })
}

export function clearRuntimePhaseCache(eventId: string) {
  cache.delete(eventId)
}
