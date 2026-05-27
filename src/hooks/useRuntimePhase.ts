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
  const [phase, setPhase] = useState<RuntimePhase | null>(
    () => readRuntimePhaseSnapshot(eventId).phase,
  )
  const [ready, setReady] = useState(() => readRuntimePhaseSnapshot(eventId).ready)

  useEffect(() => {
    if (!eventId) {
      setPhase(null)
      setReady(false)
      return
    }

    const snapshot = readRuntimePhaseSnapshot(eventId)
    setPhase(snapshot.phase)
    setReady(snapshot.ready)

    if (isOfflineEventId(eventId)) {
      return subscribeLocalRuntime(eventId, (s) => {
        writeRuntimePhaseCache(eventId, s.phase)
        setPhase(s.phase)
        setReady(true)
      })
    }

    if (!hasFirebaseConfig()) {
      writeRuntimePhaseCache(eventId, 'stopped')
      setPhase('stopped')
      setReady(true)
      return
    }

    if (!snapshot.ready) {
      setReady(false)
    }

    return watchRuntimeState(eventId, (s) => {
      const next = s?.phase ?? 'stopped'
      writeRuntimePhaseCache(eventId, next)
      setPhase(next)
      setReady(true)
    })
  }, [eventId])

  return { phase, ready }
}
