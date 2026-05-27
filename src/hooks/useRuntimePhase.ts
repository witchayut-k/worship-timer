import { useEffect, useState } from 'react'
import type { RuntimePhase } from '../domain/types'
import { hasFirebaseConfig } from '../lib/firebase'
import { isOfflineEventId } from '../lib/eventSource'
import { loadStoredLocalRuntime, subscribeLocalRuntime } from '../lib/localSync'
import { watchRuntimeState } from '../lib/firestoreRepo'

export function useRuntimePhase(eventId: string | null | undefined) {
  const [phase, setPhase] = useState<RuntimePhase | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!eventId) {
      setPhase(null)
      setReady(false)
      return
    }

    setReady(false)

    if (isOfflineEventId(eventId)) {
      const stored = loadStoredLocalRuntime(eventId)
      setPhase(stored?.phase ?? 'stopped')
      setReady(true)
      return subscribeLocalRuntime(eventId, (s) => setPhase(s.phase))
    }

    if (!hasFirebaseConfig()) {
      setPhase('stopped')
      setReady(true)
      return
    }

    return watchRuntimeState(eventId, (s) => {
      setPhase(s?.phase ?? 'stopped')
      setReady(true)
    })
  }, [eventId])

  return { phase, ready }
}
