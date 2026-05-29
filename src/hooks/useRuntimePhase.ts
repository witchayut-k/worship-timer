import { useEffect, useState } from 'react'
import type { RuntimePhase } from '../domain/types'
import { hasFirebaseConfig } from '../lib/firebase'
import { isOfflineEventId } from '../lib/eventSource'
import { subscribeLocalRuntime } from '../lib/localSync'
import {
  readRuntimePhaseSnapshot,
  writeRuntimePhaseCache,
} from '../lib/runtimePhaseCache'
import { watchRuntimeState } from '../lib/firestoreRepo'

export function useRuntimePhase(eventId: string | null | undefined) {
  const [trackedEventId, setTrackedEventId] = useState(eventId)
  const [phase, setPhase] = useState<RuntimePhase | null>(
    () => readRuntimePhaseSnapshot(eventId).phase,
  )
  const [ready, setReady] = useState(() => readRuntimePhaseSnapshot(eventId).ready)
  const [serviceEnded, setServiceEnded] = useState(false)

  if (eventId !== trackedEventId) {
    setTrackedEventId(eventId)
    if (!eventId) {
      setPhase(null)
      setReady(false)
      setServiceEnded(false)
    } else if (!isOfflineEventId(eventId) && !hasFirebaseConfig()) {
      writeRuntimePhaseCache(eventId, 'stopped')
      setPhase('stopped')
      setReady(true)
    } else {
      const snapshot = readRuntimePhaseSnapshot(eventId)
      setPhase(snapshot.phase)
      setReady(snapshot.ready)
    }
  }

  useEffect(() => {
    if (!eventId) return

    if (isOfflineEventId(eventId)) {
      return subscribeLocalRuntime(eventId, (s) => {
        writeRuntimePhaseCache(eventId, s.phase)
        setPhase(s.phase)
        setServiceEnded(s.serviceEnded ?? false)
        setReady(true)
      })
    }

    if (!hasFirebaseConfig()) return

    return watchRuntimeState(eventId, (s) => {
      const next = s?.phase ?? 'stopped'
      writeRuntimePhaseCache(eventId, next)
      setPhase(next)
      setServiceEnded(s?.serviceEnded ?? false)
      setReady(true)
    })
  }, [eventId])

  return { phase, ready, serviceEnded }
}
