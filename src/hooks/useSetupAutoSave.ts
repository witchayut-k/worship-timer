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

type UseSetupAutoSaveParams = {
  hydrated: boolean
  snapshot: string
  persistSetup: (options: { touchRuntime: boolean }) => Promise<PersistSetupOutcome>
}

export function useSetupAutoSave({
  hydrated,
  snapshot,
  persistSetup,
}: UseSetupAutoSaveParams) {
  const [saveStatus, setSaveStatus] = useState<SetupSaveStatus>('idle')
  const [saveNotice, setSaveNotice] = useState<string | null>(null)

  const lastSavedSnapshotRef = useRef<string | null>(null)
  const savingRef = useRef(false)
  const pendingFlushRef = useRef(false)
  const lastResultRef = useRef<PersistSetupOutcome | null>(null)
  const persistSetupRef = useRef(persistSetup)
  const snapshotRef = useRef(snapshot)
  const runPersistRef = useRef<
    (touchRuntime: boolean) => Promise<PersistSetupOutcome | null>
  >(async () => null)

  useEffect(() => {
    persistSetupRef.current = persistSetup
    snapshotRef.current = snapshot
  })

  useEffect(() => {
    runPersistRef.current = async (touchRuntime: boolean) => {
      savingRef.current = true
      setSaveStatus('saving')
      const snapshotAtStart = snapshotRef.current
      try {
        const result = await persistSetupRef.current({ touchRuntime })
        if (snapshotRef.current === snapshotAtStart) {
          lastSavedSnapshotRef.current = snapshotAtStart
        } else {
          pendingFlushRef.current = true
        }
        lastResultRef.current = result
        setSaveNotice(result.notice)
        setSaveStatus(result.isError ? 'error' : 'saved')
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
      await waitForSaveIdle()

      if (
        !touchRuntime &&
        snapshotRef.current === lastSavedSnapshotRef.current
      ) {
        if (lastResultRef.current) return lastResultRef.current
        return { localId: '', cloudEventId: null, notice: null, isError: false }
      }

      return runPersist(touchRuntime)
    },
    [runPersist, waitForSaveIdle],
  )

  useEffect(() => {
    if (!hydrated) {
      lastSavedSnapshotRef.current = null
      return
    }
    if (lastSavedSnapshotRef.current === null) {
      lastSavedSnapshotRef.current = snapshot
    }
  }, [hydrated, snapshot])

  const saving = saveStatus === 'saving'
  const isDirty = hydrated && snapshot !== lastSavedSnapshotRef.current

  const markSnapshotSaved = useCallback((savedSnapshot: string) => {
    lastSavedSnapshotRef.current = savedSnapshot
    setSaveStatus('saved')
  }, [])

  return {
    saveStatus,
    saveNotice,
    setSaveNotice,
    saving,
    isDirty,
    flush,
    cancelScheduled: () => {},
    markSnapshotSaved,
  }
}
