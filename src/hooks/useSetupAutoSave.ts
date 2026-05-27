import { useCallback, useEffect, useRef, useState } from 'react'
import type { DraftItem } from '../components/SetupSegmentList'
import type { EventDisplaySettings } from '../domain/types'

export type SetupSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error'

export type PersistSetupOutcome = {
  localId: string
  cloudEventId: string | null
  notice: string | null
  isError: boolean
}

export function serializeSetupSnapshot(params: {
  title: string
  date: string
  plannedStartTime: string
  settings: EventDisplaySettings
  leaderNames: string[]
  items: DraftItem[]
}): string {
  return JSON.stringify({
    title: params.title,
    date: params.date,
    plannedStartTime: params.plannedStartTime,
    settings: params.settings,
    leaderNames: params.leaderNames,
    items: params.items.map(({ order, name, leaderName, durationSec, roomLights, mediaNote }) => ({
      order,
      name,
      leaderName,
      durationSec,
      roomLights,
      mediaNote,
    })),
  })
}

const DEBOUNCE_MS = 1000

type UseSetupAutoSaveParams = {
  enabled: boolean
  hydrated: boolean
  snapshot: string
  persistSetup: (options: { touchRuntime: boolean }) => Promise<PersistSetupOutcome>
  shouldNavigateAfterSave: boolean
  onNavigateAfterSave: (eventId: string) => void
}

export function useSetupAutoSave({
  enabled,
  hydrated,
  snapshot,
  persistSetup,
  shouldNavigateAfterSave,
  onNavigateAfterSave,
}: UseSetupAutoSaveParams) {
  const [saveStatus, setSaveStatus] = useState<SetupSaveStatus>('idle')
  const [saveNotice, setSaveNotice] = useState<string | null>(null)

  const lastSavedSnapshotRef = useRef<string | null>(null)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savingRef = useRef(false)
  const pendingFlushRef = useRef(false)
  const persistSetupRef = useRef(persistSetup)
  const onNavigateRef = useRef(onNavigateAfterSave)
  const shouldNavigateRef = useRef(shouldNavigateAfterSave)
  const snapshotRef = useRef(snapshot)

  persistSetupRef.current = persistSetup
  onNavigateRef.current = onNavigateAfterSave
  shouldNavigateRef.current = shouldNavigateAfterSave
  snapshotRef.current = snapshot

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current != null) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  const runPersist = useCallback(async (touchRuntime: boolean) => {
    savingRef.current = true
    setSaveStatus('saving')
    try {
      const result = await persistSetupRef.current({ touchRuntime })
      lastSavedSnapshotRef.current = snapshotRef.current
      setSaveNotice(result.notice)
      setSaveStatus(result.isError ? 'error' : 'saved')

      const navId = result.cloudEventId ?? result.localId
      if (shouldNavigateRef.current && navId) {
        onNavigateRef.current(navId)
      }

      return result
    } catch {
      setSaveStatus('error')
      return null
    } finally {
      savingRef.current = false
      if (pendingFlushRef.current) {
        pendingFlushRef.current = false
        void runPersist(false)
      }
    }
  }, [])

  const flush = useCallback(async (touchRuntime = false) => {
    clearDebounce()
    if (!enabled && touchRuntime === false) return null

    if (savingRef.current) {
      pendingFlushRef.current = true
      return null
    }

    return runPersist(touchRuntime)
  }, [clearDebounce, enabled, runPersist])

  const scheduleSave = useCallback(() => {
    clearDebounce()
    if (!enabled || !hydrated) return
    if (snapshot === lastSavedSnapshotRef.current) return

    setSaveStatus('pending')
    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      if (snapshot === lastSavedSnapshotRef.current) {
        setSaveStatus('idle')
        return
      }
      if (savingRef.current) {
        pendingFlushRef.current = true
        return
      }
      void runPersist(false)
    }, DEBOUNCE_MS)
  }, [clearDebounce, enabled, hydrated, runPersist, snapshot])

  useEffect(() => {
    if (!hydrated) return
    if (lastSavedSnapshotRef.current === null) {
      lastSavedSnapshotRef.current = snapshot
      return
    }
    scheduleSave()
    return clearDebounce
  }, [hydrated, snapshot, scheduleSave, clearDebounce])

  useEffect(() => {
    if (!hydrated) {
      lastSavedSnapshotRef.current = null
      clearDebounce()
      setSaveStatus('idle')
      setSaveNotice(null)
    }
  }, [hydrated, clearDebounce])

  useEffect(() => () => clearDebounce(), [clearDebounce])

  const saving = saveStatus === 'pending' || saveStatus === 'saving'

  const markSnapshotSaved = useCallback((savedSnapshot: string) => {
    lastSavedSnapshotRef.current = savedSnapshot
    clearDebounce()
    setSaveStatus('saved')
  }, [clearDebounce])

  return {
    saveStatus,
    saveNotice,
    saving,
    flush,
    cancelScheduled: clearDebounce,
    markSnapshotSaved,
  }
}
