import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { pauseRuntimeIfRunning } from '../lib/endActiveControlSession'
import { getStoredLocale, translate } from '../i18n/translate'
import { storageKeys } from '../lib/storageKeys'
import {
  ActiveControlContext,
  type ActiveControl,
  type ActiveControlContextValue,
} from './activeControlContext'

const STORAGE_KEY = storageKeys.activeControl

function readStoredActiveControl(): ActiveControl | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ActiveControl
    if (typeof parsed.eventId === 'string' && typeof parsed.title === 'string') {
      return parsed
    }
  } catch {
    // ignore corrupt storage
  }
  return null
}

function writeStoredActiveControl(value: ActiveControl | null) {
  try {
    if (value) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // ignore quota / private mode
  }
}

export function ActiveControlProvider({ children }: { children: ReactNode }) {
  const [activeControl, setActiveControlState] = useState<ActiveControl | null>(() =>
    readStoredActiveControl(),
  )

  const setActiveControl = useCallback((eventId: string, title: string) => {
    const next = { eventId, title: title.trim() || translate('event.untitled', getStoredLocale()) }
    setActiveControlState(next)
    writeStoredActiveControl(next)
  }, [])

  const clearActiveControl = useCallback(() => {
    setActiveControlState(null)
    writeStoredActiveControl(null)
  }, [])

  const endActiveControl = useCallback(async () => {
    if (!activeControl) return
    await pauseRuntimeIfRunning(activeControl.eventId)
    clearActiveControl()
  }, [activeControl, clearActiveControl])

  const isProductionForEvent = useCallback(
    (eventId: string | null | undefined) =>
      Boolean(eventId && activeControl?.eventId === eventId),
    [activeControl],
  )

  const value = useMemo<ActiveControlContextValue>(
    () => ({
      activeControl,
      setActiveControl,
      clearActiveControl,
      endActiveControl,
      isProductionForEvent,
    }),
    [activeControl, setActiveControl, clearActiveControl, endActiveControl, isProductionForEvent],
  )

  return <ActiveControlContext.Provider value={value}>{children}</ActiveControlContext.Provider>
}
