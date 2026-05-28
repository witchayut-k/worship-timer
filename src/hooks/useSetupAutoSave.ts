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
  const lastResultRef = useRef<PersistSetupOutcome | null>(null)
  const persistSetupRef = useRef(persistSetup)
  const onNavigateRef = useRef(onNavigateAfterSave)
  const shouldNavigateRef = useRef(shouldNavigateAfterSave)
  const snapshotRef = useRef(snapshot)
  const runPersistRef = useRef<
    (touchRuntime: boolean) => Promise<PersistSetupOutcome | null>
  >(async () => null)

  useEffect(() => {
    persistSetupRef.current = persistSetup
    onNavigateRef.current = onNavigateAfterSave
    shouldNavigateRef.current = shouldNavigateAfterSave
    snapshotRef.current = snapshot
  })

  const clearDebounce = useCallback(() => {
    if (debounceTimerRef.current != null) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
  }, [])

  useEffect(() => {
    runPersistRef.current = async (touchRuntime: boolean) => {
      savingRef.current = true
      setSaveStatus('saving')
      // #region agent log
      fetch('http://127.0.0.1:7648/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'816df6'},body:JSON.stringify({sessionId:'816df6',location:'useSetupAutoSave.ts:runPersist',message:'persist start',data:{touchRuntime},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      try {
        const result = await persistSetupRef.current({ touchRuntime })
        lastSavedSnapshotRef.current = snapshotRef.current
        lastResultRef.current = result
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
          void runPersistRef.current(false)
        }
      }
    }
  }, [])

  const runPersist = useCallback(
    (touchRuntime: boolean) => runPersistRef.current(touchRuntime),
    [],
  )

  const waitForSaveIdle = useCallback(async () => {
    for (let i = 0; i < 120 && savingRef.current; i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  }, [])

  const flush = useCallback(
    async (touchRuntime = false) => {
      clearDebounce()
      await waitForSaveIdle()

      if (
        !touchRuntime &&
        !enabled &&
        snapshotRef.current === lastSavedSnapshotRef.current &&
        lastResultRef.current
      ) {
        return lastResultRef.current
      }

      if (!touchRuntime && !enabled) return null

      if (
        !touchRuntime &&
        snapshotRef.current === lastSavedSnapshotRef.current
      ) {
        if (lastResultRef.current) return lastResultRef.current
        return { localId: '', cloudEventId: null, notice: null, isError: false }
      }

      return runPersist(touchRuntime)
    },
    [clearDebounce, enabled, runPersist, waitForSaveIdle],
  )

  const scheduleSave = useCallback(() => {
    clearDebounce()
    if (!enabled || !hydrated) return
    if (snapshot === lastSavedSnapshotRef.current) return

    // #region agent log
    fetch('http://127.0.0.1:7648/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'816df6'},body:JSON.stringify({sessionId:'816df6',location:'useSetupAutoSave.ts:scheduleSave',message:'save scheduled',data:{enabled,hydrated},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
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
    if (hydrated) return
    lastSavedSnapshotRef.current = null
    clearDebounce()
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
