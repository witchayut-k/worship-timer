import { useEffect, useRef, useState } from 'react'

/**
 * Keeps loading visible until `loading` is false AND at least `minMs` have passed
 * since the current loading spell began.
 */
export function useMinDurationLoading(loading: boolean, minMs: number): boolean {
  const [visible, setVisible] = useState(loading)
  const loadStartRef = useRef<number | null>(loading ? Date.now() : null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    if (minMs <= 0) {
      setVisible(loading)
      loadStartRef.current = loading ? Date.now() : null
      return
    }

    if (loading) {
      loadStartRef.current = Date.now()
      setVisible(true)
      return
    }

    if (loadStartRef.current == null) {
      setVisible(false)
      return
    }

    const remaining = minMs - (Date.now() - loadStartRef.current)

    if (remaining <= 0) {
      loadStartRef.current = null
      setVisible(false)
      return
    }

    hideTimerRef.current = setTimeout(() => {
      loadStartRef.current = null
      hideTimerRef.current = null
      setVisible(false)
    }, remaining)

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }
  }, [loading, minMs])

  return visible
}
