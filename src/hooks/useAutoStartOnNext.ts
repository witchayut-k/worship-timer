import { useCallback, useState } from 'react'

export const AUTO_START_ON_NEXT_STORAGE_KEY = 'worship-timer:control-auto-start-on-next'

function readStoredAutoStartOnNext(): boolean {
  try {
    const raw = localStorage.getItem(AUTO_START_ON_NEXT_STORAGE_KEY)
    return raw === '1' || raw === 'true'
  } catch {
    return false
  }
}

function persistAutoStartOnNext(enabled: boolean) {
  try {
    localStorage.setItem(AUTO_START_ON_NEXT_STORAGE_KEY, enabled ? '1' : '0')
  } catch {
    // ignore
  }
}

export function useAutoStartOnNext() {
  const [autoStartOnNext, setAutoStartOnNextState] = useState(readStoredAutoStartOnNext)

  const setAutoStartOnNext = useCallback((enabled: boolean) => {
    setAutoStartOnNextState(enabled)
    persistAutoStartOnNext(enabled)
  }, [])

  return { autoStartOnNext, setAutoStartOnNext }
}
