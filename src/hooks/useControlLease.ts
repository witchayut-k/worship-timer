import { useCallback, useEffect, useRef, useState } from 'react'
import type { ControlLease } from '../domain/types'
import {
  claimControlLease,
  getOrCreateControlLeaseSessionId,
  heartbeatControlLease,
  HEARTBEAT_INTERVAL_MS,
  isLeaseExpired,
  isLeaseHolder,
  releaseControlLease,
  takeoverControlLease,
  watchControlLease,
} from '../lib/controlLease'

export type ControlLeaseStatus = 'idle' | 'claiming' | 'holder' | 'observer' | 'error'

type Params = {
  eventId: string
  enabled: boolean
  uid: string | null
  authReady: boolean
}

export function useControlLease({ eventId, enabled, uid, authReady }: Params) {
  const sessionIdRef = useRef('')
  const statusRef = useRef<ControlLeaseStatus>('idle')
  const [status, setStatus] = useState<ControlLeaseStatus>('idle')
  const [takeoverOpen, setTakeoverOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setStatusSafe = useCallback((next: ControlLeaseStatus) => {
    statusRef.current = next
    setStatus(next)
  }, [])

  const canWrite = !enabled || status === 'holder'

  const release = useCallback(async () => {
    if (!enabled || !uid || !sessionIdRef.current) return
    try {
      await releaseControlLease(eventId, uid, sessionIdRef.current)
    } catch {
      // best-effort
    }
  }, [enabled, eventId, uid])

  useEffect(() => {
    if (!enabled) {
      setStatusSafe('holder')
      return
    }
    if (!eventId) return
    sessionIdRef.current = getOrCreateControlLeaseSessionId(eventId)
  }, [enabled, eventId, setStatusSafe])

  useEffect(() => {
    if (!enabled) return
    if (!authReady || !uid || !eventId) return

    let cancelled = false
    setStatusSafe('claiming')
    setError(null)

    void claimControlLease(eventId, uid, sessionIdRef.current)
      .then((outcome) => {
        if (cancelled) return
        if (outcome === 'observer') {
          setStatusSafe('observer')
        } else {
          setStatusSafe('holder')
        }
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Lease claim failed')
        setStatusSafe('error')
      })

    return () => {
      cancelled = true
    }
  }, [authReady, enabled, eventId, setStatusSafe, uid])

  useEffect(() => {
    if (!enabled || !uid || !eventId) return

    return watchControlLease(eventId, (lease: ControlLease | null) => {
      const nowMs = Date.now()
      const sessionId = sessionIdRef.current

      if (lease && isLeaseHolder(lease, uid, sessionId, nowMs)) {
        if (statusRef.current !== 'holder') setStatusSafe('holder')
        return
      }

      if (lease && !isLeaseExpired(lease, nowMs)) {
        if (statusRef.current === 'holder') {
          setStatusSafe('observer')
        } else if (statusRef.current !== 'claiming') {
          setStatusSafe('observer')
        }
      }
    })
  }, [enabled, eventId, setStatusSafe, uid])

  useEffect(() => {
    if (!enabled || status !== 'holder' || !uid) return

    const tick = () => {
      if (document.visibilityState !== 'visible') return
      void heartbeatControlLease(eventId, uid, sessionIdRef.current).catch(() => {
        // ignore transient network errors
      })
    }

    tick()
    const id = window.setInterval(tick, HEARTBEAT_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [enabled, eventId, status, uid])

  useEffect(() => {
    if (!enabled) return
    const onBeforeUnload = () => {
      void release()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      void release()
    }
  }, [enabled, release])

  const requestTakeover = useCallback(() => {
    setTakeoverOpen(true)
  }, [])

  const cancelTakeover = useCallback(() => {
    setTakeoverOpen(false)
  }, [])

  const confirmTakeover = useCallback(async () => {
    if (!uid || !enabled) return
    setTakeoverOpen(false)
    setStatusSafe('claiming')
    try {
      await takeoverControlLease(eventId, uid, sessionIdRef.current)
      setStatusSafe('holder')
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Takeover failed')
      setStatusSafe('error')
    }
  }, [enabled, eventId, setStatusSafe, uid])

  return {
    status,
    canWrite,
    error,
    takeoverOpen,
    requestTakeover,
    confirmTakeover,
    cancelTakeover,
    release,
  }
}
