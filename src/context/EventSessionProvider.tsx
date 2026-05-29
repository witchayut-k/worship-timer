import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  DEFAULT_EVENT_DISPLAY_SETTINGS,
  type ProgramItem,
  type WorshipEvent,
} from '../domain/types'
import { useAuth } from '../hooks/useAuth'
import { getStoredLocale, translate } from '../i18n/translate'
import { decodeLocalPayload } from '../lib/localPayload'
import { isSessionRoomId } from '../lib/freeSession'
import { hasFirebaseConfig } from '../lib/firebase'
import {
  draftBundleFromEventProgram,
  isSetupDraftDirty as computeDraftDirty,
  shouldRefreshDraftForProgramItems,
  snapshotFromDraftBundle,
  type SetupDraftBundle,
} from '../lib/eventSessionDraft'
import { getLocalEvent, isLibraryEventId } from '../lib/localLibrary'
import {
  loadEvent,
  upsertEventProgram,
  watchEvent,
  watchProgramItems,
} from '../lib/firestoreRepo'
import { EventSessionContext, type EventSessionStatus } from './eventSessionContext'

type EventSessionProviderProps = {
  eventId: string
  children: ReactNode
}

export function EventSessionProvider({ eventId, children }: EventSessionProviderProps) {
  const { uid, ready: authReady } = useAuth()
  const cloudReady = hasFirebaseConfig()

  const [status, setStatus] = useState<EventSessionStatus>('loading')
  const [event, setEvent] = useState<WorshipEvent | null>(null)
  const [programItems, setProgramItems] = useState<ProgramItem[]>([])
  const [programItemsHydrated, setProgramItemsHydrated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [setupDraft, setSetupDraft] = useState<SetupDraftBundle | null>(null)
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string | null>(null)

  const setupDraftRef = useRef<SetupDraftBundle | null>(null)
  const lastSavedSnapshotRef = useRef<string | null>(null)
  const programItemsRef = useRef<ProgramItem[]>([])
  const eventRef = useRef<WorshipEvent | null>(null)
  const programItemsHydratedRef = useRef(false)

  useEffect(() => {
    setupDraftRef.current = setupDraft
  }, [setupDraft])

  useEffect(() => {
    lastSavedSnapshotRef.current = lastSavedSnapshot
  }, [lastSavedSnapshot])

  useEffect(() => {
    programItemsRef.current = programItems
  }, [programItems])

  useEffect(() => {
    eventRef.current = event
  }, [event])

  useEffect(() => {
    programItemsHydratedRef.current = programItemsHydrated
  }, [programItemsHydrated])

  const canLoadSession = authReady && (!cloudReady || Boolean(uid))
  const sessionLoadKey = canLoadSession ? `${eventId}:${uid ?? ''}` : null
  const [activeSessionLoadKey, setActiveSessionLoadKey] = useState(sessionLoadKey)

  if (sessionLoadKey !== activeSessionLoadKey) {
    setActiveSessionLoadKey(sessionLoadKey)
    if (sessionLoadKey !== null) {
      const locale = getStoredLocale()
      const tr = (key: string) => translate(key, locale)

      if (isLibraryEventId(eventId)) {
        const entry = getLocalEvent(eventId)
        if (!entry) {
          setError(tr('setup.loadLocalNotFound'))
          setStatus('error')
          setEvent(null)
          setProgramItems([])
          setProgramItemsHydrated(false)
          setSetupDraft(null)
          setLastSavedSnapshot(null)
        } else {
          const nextDraft = draftBundleFromEventProgram({
            event: entry.event,
            programItems: entry.items,
          })
          setEvent(entry.event)
          setProgramItems(entry.items)
          setSetupDraft(nextDraft)
          setLastSavedSnapshot(snapshotFromDraftBundle(nextDraft))
          setProgramItemsHydrated(true)
          setError(null)
          setStatus('ready')
        }
      } else if (eventId.startsWith('local-')) {
        const payload = decodeLocalPayload(eventId)
        if (!payload) {
          setError(tr('setup.loadLegacyLocal'))
          setStatus('error')
          setEvent(null)
          setProgramItems([])
          setProgramItemsHydrated(false)
          setSetupDraft(null)
          setLastSavedSnapshot(null)
        } else {
          const nextDraft = draftBundleFromEventProgram({
            event: payload.event,
            programItems: payload.items,
          })
          setEvent(payload.event)
          setProgramItems(payload.items)
          setSetupDraft(nextDraft)
          setLastSavedSnapshot(snapshotFromDraftBundle(nextDraft))
          setProgramItemsHydrated(true)
          setError(null)
          setStatus('ready')
        }
      } else {
        setStatus('loading')
        setError(null)
        setEvent(null)
        setProgramItems([])
        setProgramItemsHydrated(false)
        setSetupDraft(null)
        setLastSavedSnapshot(null)
      }
    }
  }

  const refreshDraftFromServer = useCallback(
    (nextEvent: WorshipEvent | null, nextItems: ProgramItem[]) => {
      if (!nextEvent) return
      const draft = setupDraftRef.current
      const saved = lastSavedSnapshotRef.current
      if (!shouldRefreshDraftForProgramItems(draft, nextItems, saved)) return
      const nextDraft = draftBundleFromEventProgram({
        event: nextEvent,
        programItems: nextItems,
      })
      setSetupDraft(nextDraft)
      setLastSavedSnapshot(snapshotFromDraftBundle(nextDraft))
    },
    [],
  )

  useEffect(() => {
    if (!sessionLoadKey) return

    let cancelled = false
    const locale = getStoredLocale()
    const t = (key: string) => translate(key, locale)

    if (isLibraryEventId(eventId) || eventId.startsWith('local-')) {
      return
    }

    if (cloudReady && uid) {
      let sawEvent = false

      const bootstrap = async () => {
        try {
          const ev = await loadEvent(eventId)
          if (cancelled) return
          if (!ev) {
            if (isSessionRoomId(eventId)) {
              const emptyEvent: WorshipEvent = {
                title: '',
                date: new Date().toISOString().slice(0, 10),
                status: 'active',
                updatedAtMs: Date.now(),
                settings: { ...DEFAULT_EVENT_DISPLAY_SETTINGS },
                leaderNames: [],
                ownerUid: uid,
              }
              await upsertEventProgram({
                eventId,
                event: emptyEvent,
                items: [],
              })
              return
            }
            setError(t('setup.loadCloudNotFound'))
            setStatus('error')
            return
          }
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : t('setup.loadFailed'))
            setStatus('error')
          }
        }
      }

      void bootstrap()

      const unsubEvent = watchEvent(eventId, (ev) => {
        if (cancelled) return
        if (!ev) {
          if (!isSessionRoomId(eventId)) {
            setError(t('setup.loadCloudNotFound'))
            setStatus('error')
          }
          return
        }
        sawEvent = true
        setEvent(ev)
        setError(null)
        setStatus('ready')
        if (programItemsHydratedRef.current) {
          refreshDraftFromServer(ev, programItemsRef.current)
        }
      })

      const unsubItems = watchProgramItems(eventId, (items) => {
        if (cancelled) return
        setProgramItems(items)
        setProgramItemsHydrated(true)
        if (sawEvent && eventRef.current) {
          refreshDraftFromServer(eventRef.current, items)
        }
      })

      return () => {
        cancelled = true
        unsubEvent()
        unsubItems()
      }
    }

    setError(t('setup.loadSignInRequired'))
    setStatus('error')
    return undefined
  }, [sessionLoadKey, eventId, cloudReady, uid, refreshDraftFromServer])

  const hasSetupDraft = useCallback(() => setupDraftRef.current !== null, [])

  const ensureSetupDraft = useCallback((): SetupDraftBundle => {
    const existing = setupDraftRef.current
    if (existing) return existing

    const ev = event
    if (!ev) {
      const empty: SetupDraftBundle = {
        title: '',
        date: new Date().toISOString().slice(0, 10),
        plannedStartTime: '',
        settings: { ...DEFAULT_EVENT_DISPLAY_SETTINGS },
        leaderNames: [],
        items: [],
      }
      setSetupDraft(empty)
      return empty
    }

    const draft = draftBundleFromEventProgram({
      event: ev,
      programItems,
    })
    setSetupDraft(draft)
    return draft
  }, [event, programItems])

  const replaceSetupDraft = useCallback((draft: SetupDraftBundle) => {
    setSetupDraft(draft)
  }, [])

  const markSetupDraftSaved = useCallback((snapshot: string) => {
    setLastSavedSnapshot(snapshot)
  }, [])

  const isSetupDraftDirtyFn = useCallback(() => {
    const draft = setupDraftRef.current
    if (!draft) return false
    return computeDraftDirty(draft, lastSavedSnapshotRef.current)
  }, [])

  const notifyProgramPersisted = useCallback((nextEvent: WorshipEvent, items: ProgramItem[]) => {
    setEvent(nextEvent)
    setProgramItems(items)
  }, [])

  const value = useMemo(
    () => ({
      eventId,
      status,
      event,
      programItems,
      programItemsHydrated,
      setupDraft,
      error,
      hasSetupDraft,
      ensureSetupDraft,
      replaceSetupDraft,
      markSetupDraftSaved,
      isSetupDraftDirty: isSetupDraftDirtyFn,
      notifyProgramPersisted,
    }),
    [
      eventId,
      status,
      event,
      programItems,
      programItemsHydrated,
      setupDraft,
      error,
      hasSetupDraft,
      ensureSetupDraft,
      replaceSetupDraft,
      markSetupDraftSaved,
      isSetupDraftDirtyFn,
      notifyProgramPersisted,
    ],
  )

  return <EventSessionContext.Provider value={value}>{children}</EventSessionContext.Provider>
}
