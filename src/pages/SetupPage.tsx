import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { usePlan } from '../hooks/usePlan'
import { ConfirmModal } from '../components/ConfirmModal'
import { ControlShell } from '../components/ControlShell'
import { SetupFormStatusBar } from '../components/SetupFormStatusBar'
import { LeaveControlModal } from '../components/LeaveControlModal'
import { SetupAsidePanel } from '../components/SetupAsidePanel'
import { SetupEventDetailsCard } from '../components/SetupEventDetailsCard'
import {
  SpreadsheetImportModal,
  type SpreadsheetImportMode,
} from '../components/SpreadsheetImportModal'
import { SetupSegmentList, type DraftItem } from '../components/SetupSegmentList'
import { usePlannedSegmentSchedule } from '../hooks/usePlannedSegmentSchedule'
import { BookIcon, PlusIcon, RotateCcwIcon, SaveIcon, TableIcon } from '../components/SetupIcons'
import type { ParsedProgramRow } from '../domain/spreadsheetImport'
import {
  DEFAULT_EVENT_DISPLAY_SETTINGS,
  type EventDisplaySettings,
  type ProgramItem,
  type RuntimePhase,
  type RuntimeState,
  type WorshipEvent,
} from '../domain/types'
import { formatSecToHhMmSs } from '../domain/time'
import { getOutputLink } from '../lib/outputLinks'
import { useActiveControl } from '../hooks/useActiveControl'
import { useAuth } from '../hooks/useAuth'
import { useLeaveControl } from '../hooks/useLeaveControl'
import { useOptionalEventSession } from '../hooks/useEventSession'
import type { EventSessionContextValue } from '../context/eventSessionContext'
import {
  serializeSetupSnapshot,
  useSetupAutoSave,
  type PersistSetupOutcome,
} from '../hooks/useSetupAutoSave'
import { useLocale } from '../i18n/useLocale'
import {
  draftBundleFromEventProgram,
  draftItemsToProgramItems,
  newDraftItemId,
  snapshotFromDraftBundle,
} from '../lib/eventSessionDraft'
import { isOfflineEventId } from '../lib/eventSource'
import { loadStoredLocalRuntime, subscribeLocalRuntime } from '../lib/localSync'
import { hasFirebaseConfig } from '../lib/firebase'
import { collectLeadersFromItems } from '../lib/leaders'
import { isLibraryEventId, newLocalLibraryId, upsertLocalEvent } from '../lib/localLibrary'
import {
  loadRuntimeState,
  upsertEventProgram,
  upsertEventWithItems,
  watchRuntimeState,
} from '../lib/firestoreRepo'
import { getStageTheme } from '../lib/displayTheme'
import { deriveLocalDisplay, initialRuntimeState } from '../lib/runtimeEngine'
import { reconcileRuntimeAfterProgramChange, type ProgramChange } from '../lib/reconcileRuntime'
import { needsSetupPersistBeforeNav } from '../lib/setupNavigation'
import {
  acknowledgeDirectCloudSave,
  getWorkspaceSyncSnapshot,
} from '../lib/workspaceCloudSync'
import { readWorkspaceDraft, writeWorkspaceDraft } from '../lib/workspaceDraftStore'
import { syncRuntimeState } from '../lib/syncRuntimeState'

function newId(): string {
  return newDraftItemId()
}

function newCloudEventId(): string {
  return Date.now().toString(36)
}

function parsedRowsToDraftItems(rows: ParsedProgramRow[]): DraftItem[] {
  return rows.map((row, i) => ({
    id: newId(),
    order: i + 1,
    name: row.name,
    leaderName: row.leaderName,
    durationSec: row.durationSec,
    roomLights: row.roomLights,
    mediaNote: row.mediaNote,
  }))
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

type SetupPageProps = {
  mode: 'new' | 'edit'
}

export function SetupPage({ mode }: SetupPageProps) {
  const { eventId: routeEventId } = useParams()
  return <SetupPageInner mode={mode} routeEventId={routeEventId} />
}

function readInitialSetupTitle(session: EventSessionContextValue | null): string {
  if (!session) return ''
  if (session.hasSetupDraft()) return session.ensureSetupDraft().title
  return session.event?.title ?? ''
}

function SetupPageInner({
  mode,
  routeEventId,
}: {
  mode: 'new' | 'edit'
  routeEventId?: string
}) {
  const nav = useNavigate()
  const location = useLocation()
  const { t } = useLocale()
  const { isProductionForEvent } = useActiveControl()
  const focusOrder = (location.state as { focusOrder?: number } | null)?.focusOrder
  const { uid, ready: authReady } = useAuth()
  const { isFree, isPaid } = usePlan()
  const session = useOptionalEventSession()
  const isEdit = mode === 'edit' && Boolean(routeEventId)
  const needsInitialEventId = !isEdit && !routeEventId
  const cloudMode = hasFirebaseConfig() && Boolean(uid)
  const cloudReady = hasFirebaseConfig()

  const [title, setTitle] = useState(() => readInitialSetupTitle(session))
  const [titleError, setTitleError] = useState<string | null>(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [plannedStartTime, setPlannedStartTime] = useState('')
  const [settings, setSettings] = useState<EventDisplaySettings>(DEFAULT_EVENT_DISPLAY_SETTINGS)
  const [leaderNames, setLeaderNames] = useState<string[]>([])
  const [items, setItems] = useState<DraftItem[]>([])
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)
  const [navFocusConsumed, setNavFocusConsumed] = useState(false)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [manualSaving, setManualSaving] = useState(false)
  const [navSaving, setNavSaving] = useState(false)
  const [startSaving, setStartSaving] = useState(false)
  const [formHydrated, setFormHydrated] = useState(false)
  const isProgramLoading = Boolean(routeEventId) && session
    ? !authReady || (session.status === 'loading' && !session.hasSetupDraft())
    : false
  const loadError = session?.error ?? null
  const hydrated = !isProgramLoading && (!routeEventId || formHydrated)
  const [importOpen, setImportOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [liveRuntime, setLiveRuntime] = useState<RuntimeState | null>(null)
  const baselineSeededRef = useRef(false)

  const navAutoFocusId = useMemo(() => {
    if (isProgramLoading || navFocusConsumed || focusOrder == null || !items.length) return null
    return items.find((it) => it.order === focusOrder)?.id ?? null
  }, [isProgramLoading, navFocusConsumed, focusOrder, items])

  const autoFocusId = newlyAddedId ?? navAutoFocusId

  const onAutoFocusDone = useCallback(() => {
    setNewlyAddedId(null)
    if (navAutoFocusId != null) setNavFocusConsumed(true)
  }, [navAutoFocusId])

  const canStart = useMemo(() => items.length > 0, [items.length])
  const totalSec = useMemo(() => items.reduce((s, it) => s + it.durationSec, 0), [items])
  const totalLabel = formatSecToHhMmSs(totalSec)
  const plannedSchedule = usePlannedSegmentSchedule(items, date, plannedStartTime)
  const setupEventId = routeEventId ?? lastEventId ?? null
  const productionMode = isProductionForEvent(setupEventId)
  const liveEventId = useMemo(() => {
    const eid = routeEventId ?? lastEventId
    if (!eid || !isProductionForEvent(eid)) return null
    return eid
  }, [routeEventId, lastEventId, isProductionForEvent])

  const liveIndex = liveRuntime?.currentIndex ?? null
  const livePhase: RuntimePhase | null = liveRuntime?.phase ?? null
  const liveNowIntervalMs = liveRuntime?.phase === 'running' ? 200 : 1000
  const nowMs = useNowMs(liveEventId ? liveNowIntervalMs : 60_000)

  const liveDotTheme = useMemo(() => {
    if (!productionMode || !liveRuntime) return null
    if (liveRuntime.serviceEnded) return null
    const { remainingSec } = deriveLocalDisplay({ state: liveRuntime, nowMs })
    return getStageTheme({ remainingSec, settings })
  }, [productionMode, liveRuntime, nowMs, settings])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormHydrated(false)
    baselineSeededRef.current = false
  }, [routeEventId])

  useEffect(() => {
    if (routeEventId || formHydrated || isProgramLoading) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormHydrated(true)
  }, [routeEventId, formHydrated, isProgramLoading])

  useEffect(() => {
    if (!session || !routeEventId || formHydrated) return
    if (session.status === 'error') return
    if (session.status === 'loading') return
    if (!session.programItemsHydrated || !session.event) return

    const draft = draftBundleFromEventProgram({
      event: session.event,
      programItems: session.programItems,
    })
    session.replaceSetupDraft(draft)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(draft.title)
    setDate(draft.date)
    setPlannedStartTime(draft.plannedStartTime)
    setSettings(draft.settings)
    setLeaderNames(draft.leaderNames)
    setItems(draft.items)
    setLastEventId(routeEventId)
    setFormHydrated(true)
  }, [session, routeEventId, formHydrated, session?.status, session?.programItemsHydrated, session?.event, session?.programItems])

  useEffect(() => {
    if (!session || !formHydrated) return
    const nextDraft = {
      title,
      date,
      plannedStartTime,
      settings,
      leaderNames,
      items,
    }
    if (
      session.setupDraft &&
      snapshotFromDraftBundle(session.setupDraft) === snapshotFromDraftBundle(nextDraft)
    ) {
      return
    }
    session.replaceSetupDraft(nextDraft)
  }, [session, formHydrated, title, date, plannedStartTime, settings, leaderNames, items])

  useEffect(() => {
    if (!liveEventId) return

    if (isOfflineEventId(liveEventId)) {
      return subscribeLocalRuntime(liveEventId, (s) => {
        setLiveRuntime(s)
      })
    }

    if (cloudReady && uid) {
      return watchRuntimeState(liveEventId, (s) => {
        setLiveRuntime(s ?? null)
      })
    }
  }, [liveEventId, cloudReady, uid])

  const buildEvent = useCallback(
    (roster: string[]): WorshipEvent => ({
      title: title.trim(),
      date,
      ...(plannedStartTime.trim() ? { plannedStartTime: plannedStartTime.trim() } : {}),
      status: 'active',
      updatedAtMs: Date.now(),
      settings,
      leaderNames: roster,
      ...(uid ? { ownerUid: uid } : {}),
    }),
    [title, date, plannedStartTime, settings, uid],
  )

  const buildProgramItems = useCallback(
    (sourceItems: DraftItem[] = items): ProgramItem[] => draftItemsToProgramItems(sourceItems),
    [items],
  )

  const onAdd = () => {
    const id = newId()
    const baseName = t('setup.newSegment').trim()
    const baseRe = escapeRegExp(baseName)
    const matchRe = new RegExp(`^${baseRe}(?: \\((\\d+)\\))?$`)
    setItems((prev) => [
      ...prev,
      {
        id,
        order: prev.length + 1,
        name: (() => {
          // Generate the smallest available index:
          // baseName = (1), baseName (2), baseName (3), ...
          const used = new Set<number>()
          for (const it of prev) {
            const name = it.name?.trim()
            if (!name) continue
            const m = name.match(matchRe)
            if (!m) continue
            const n = m[1] ? Number(m[1]) : 1
            if (Number.isFinite(n) && n > 0) used.add(n)
          }
          let next = 1
          while (used.has(next)) next += 1
          return next === 1 ? baseName : `${baseName} (${next})`
        })(),
        leaderName: '',
        durationSec: 300,
        roomLights: '',
        mediaNote: '',
      },
    ])
    setNewlyAddedId(id)
  }

  const onResetClick = () => {
    if (!items.length) return
    if (productionMode && livePhase === 'running') return
    setResetModalOpen(true)
  }

  const persistSetupRef = useRef<
    (options: {
      touchRuntime: boolean
      sourceItems?: DraftItem[]
      sourceLeaderNames?: string[]
    }) => Promise<PersistSetupOutcome>
  >(async () => ({ localId: '', cloudEventId: null, notice: null, isError: true }))
  const flushRef = useRef<(touchRuntime?: boolean) => Promise<PersistSetupOutcome | null>>(
    async () => null,
  )

  const reconcileRuntime = useCallback(
    async (nextItems: DraftItem[], change: ProgramChange) => {
      if (!liveEventId) return
      const currentRuntime =
        liveRuntime ??
        (isOfflineEventId(liveEventId) ? loadStoredLocalRuntime(liveEventId) : await loadRuntimeState(liveEventId))
      if (!currentRuntime) return

      const reconciled = reconcileRuntimeAfterProgramChange({
        prev: currentRuntime,
        nextItems: draftItemsToProgramItems(nextItems),
        change,
      })
      if (reconciled === currentRuntime) return
      const synced = await syncRuntimeState(liveEventId, reconciled)
      setLiveRuntime(synced)
    },
    [liveEventId, liveRuntime],
  )

  const onRemove = (id: string, removedIndex: number) => {
    if (productionMode && livePhase === 'running' && liveIndex === removedIndex) return
    const nextItems = items.filter((x) => x.id !== id).map((x, i) => ({ ...x, order: i + 1 }))
    setItems(nextItems)
    setNewlyAddedId((cur) => (cur === id ? null : cur))
    if (productionMode) {
      void reconcileRuntime(nextItems, { type: 'delete', removedIndex })
    }
  }

  const onUpdate = (id: string, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const onReorder = (params: { items: DraftItem[]; fromIndex: number; toIndex: number }) => {
    if (productionMode && livePhase === 'running') return
    setItems(params.items)
    if (productionMode) {
      void reconcileRuntime(params.items, {
        type: 'reorder',
        fromIndex: params.fromIndex,
        toIndex: params.toIndex,
      })
    }
  }

  const startWithEventId = (eventId: string) => {
    setLastEventId(eventId)
    nav(`/start/${eventId}`)
  }

  const persistLocal = useCallback(
    (overrides?: { items?: DraftItem[]; leaderNames?: string[] }): string | null => {
    if (isFree) return null
    const itemsToUse = overrides?.items ?? items
    const leadersToUse = overrides?.leaderNames ?? leaderNames
    const roster = collectLeadersFromItems(
      leadersToUse,
      itemsToUse.map((it) => it.leaderName),
    )
    const programItems = buildProgramItems(itemsToUse)
    const reuseLocalId =
      isEdit && routeEventId && lastEventId === routeEventId && isLibraryEventId(lastEventId)
    const id = upsertLocalEvent({
      id: reuseLocalId ? lastEventId! : newLocalLibraryId(),
      event: buildEvent(roster),
      items: programItems,
    })
    setLastEventId(id)
    return id
  },
    [buildEvent, buildProgramItems, isEdit, isFree, items, lastEventId, leaderNames, routeEventId],
  )

  const persistCloud = useCallback(
    async (
      touchRuntime: boolean,
      overrides?: { items?: DraftItem[]; leaderNames?: string[] },
    ): Promise<string | null> => {
      if (!cloudMode || !uid) return null
      const itemsToUse = overrides?.items ?? items
      const leadersToUse = overrides?.leaderNames ?? leaderNames
      const cloudRouteId =
        routeEventId && !isOfflineEventId(routeEventId) ? routeEventId : null
      const reuseCloudId =
        (isEdit && routeEventId && lastEventId === routeEventId && !isOfflineEventId(lastEventId)) ||
        (!cloudRouteId && lastEventId !== null && !isOfflineEventId(lastEventId))
      const eventId = cloudRouteId ?? (reuseCloudId ? lastEventId : newCloudEventId())
      const roster = collectLeadersFromItems(
        leadersToUse,
        itemsToUse.map((it) => it.leaderName),
      )
      const programItems = buildProgramItems(itemsToUse)
      const event = buildEvent(roster)
      if (touchRuntime) {
        await upsertEventWithItems({
          eventId,
          event,
          items: programItems,
          initialState: initialRuntimeState({ items: programItems }),
        })
      } else {
        await upsertEventProgram({ eventId, event, items: programItems })
      }
      setLastEventId(eventId)
      return eventId
    },
    [buildEvent, buildProgramItems, cloudMode, isEdit, items, lastEventId, leaderNames, routeEventId, uid],
  )

  const persistSetup = useCallback(
    async ({
      touchRuntime,
      sourceItems,
      sourceLeaderNames,
    }: {
      touchRuntime: boolean
      sourceItems?: DraftItem[]
      sourceLeaderNames?: string[]
    }): Promise<PersistSetupOutcome> => {
      try {
        const itemsToSave = sourceItems ?? items
        const leadersToSave = sourceLeaderNames ?? leaderNames
        const overrides = sourceItems
          ? { items: itemsToSave, leaderNames: leadersToSave }
          : undefined
        const roster = collectLeadersFromItems(
          leadersToSave,
          itemsToSave.map((it) => it.leaderName),
        )
        const programItems = buildProgramItems(itemsToSave)
        const savedEvent = buildEvent(roster)

        const cloudRouteId =
          routeEventId && !isOfflineEventId(routeEventId) ? routeEventId : null
        const reuseCloudId =
          isEdit && routeEventId && lastEventId === routeEventId && !isOfflineEventId(lastEventId)
        const resolvedEventId =
          cloudRouteId ?? (reuseCloudId ? lastEventId! : cloudMode ? newCloudEventId() : null)

        let cloudEventId: string | null = resolvedEventId

        if (cloudMode) {
          cloudEventId = await persistCloud(touchRuntime, overrides)
          if (
            cloudEventId &&
            !isOfflineEventId(cloudEventId) &&
            !isLibraryEventId(cloudEventId)
          ) {
            const record = writeWorkspaceDraft(cloudEventId, {
              event: savedEvent,
              items: programItems,
            })
            acknowledgeDirectCloudSave(cloudEventId, record.revision, true)
          } else if (cloudEventId) {
            const draft = readWorkspaceDraft(cloudEventId)
            const snap = getWorkspaceSyncSnapshot(cloudEventId)
            const rev = Math.max(draft?.revision ?? 0, snap.localRevision, 1)
            acknowledgeDirectCloudSave(cloudEventId, rev, true)
          }
        }

        const localId = persistLocal(overrides) ?? ''
        if (session) {
          session.notifyProgramPersisted(savedEvent, programItems)
          session.markSetupDraftSaved(
            snapshotFromDraftBundle({
              title,
              date,
              plannedStartTime,
              settings,
              leaderNames: leadersToSave,
              items: itemsToSave,
            }),
          )
        }
        const notice = cloudEventId
          ? touchRuntime
            ? t('setup.savedSynced')
            : t('setup.saved')
          : t('setup.saved')
        return { localId, cloudEventId, notice, isError: false }
      } catch (e) {
        const msg = e instanceof Error ? e.message : t('setup.saveFailed')
        const isPermission =
          msg.includes('permission') || msg.includes('PERMISSION')
        try {
          const localId = persistLocal() ?? ''
          const notice = isPermission
            ? t('setup.savedLocalCloudFailed')
            : t('setup.saved')
          return { localId, cloudEventId: null, notice, isError: isPermission }
        } catch {
          const notice = isPermission ? t('setup.saveCloudPermission') : msg
          return { localId: '', cloudEventId: null, notice, isError: true }
        }
      }
    },
    [
      buildEvent,
      buildProgramItems,
      cloudMode,
      isEdit,
      items,
      lastEventId,
      leaderNames,
      persistCloud,
      persistLocal,
      routeEventId,
      session,
      t,
      title,
      date,
      plannedStartTime,
      settings,
    ],
  )

  const setupSnapshot = useMemo(
    () =>
      serializeSetupSnapshot({
        title,
        date,
        plannedStartTime,
        settings,
        leaderNames,
        items,
      }),
    [title, date, plannedStartTime, settings, leaderNames, items],
  )

  const {
    saveStatus,
    saveNotice,
    saving: autoSaving,
    isDirty,
    flush,
    cancelScheduled,
    markSnapshotSaved,
  } = useSetupAutoSave({
    hydrated,
    snapshot: setupSnapshot,
    persistSetup,
  })

  useEffect(() => {
    if (!session || !formHydrated || !session.setupDraft) return
    if (isDirty || session.isSetupDraftDirty()) return
    const draft = session.setupDraft
    if (snapshotFromDraftBundle(draft) === setupSnapshot) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(draft.title)
    setDate(draft.date)
    setPlannedStartTime(draft.plannedStartTime)
    setSettings(draft.settings)
    setLeaderNames(draft.leaderNames)
    setItems(draft.items)
  }, [session, formHydrated, isDirty, session?.setupDraft, setupSnapshot])

  useEffect(() => {
    persistSetupRef.current = persistSetup
    flushRef.current = flush
  }, [persistSetup, flush])

  useEffect(() => {
    if (!formHydrated || baselineSeededRef.current || !session) return
    session.markSetupDraftSaved(setupSnapshot)
    markSnapshotSaved(setupSnapshot)
    baselineSeededRef.current = true
  }, [formHydrated, session, markSnapshotSaved, setupSnapshot])

  const onSpreadsheetImport = useCallback(
    (rows: ParsedProgramRow[], importMode: SpreadsheetImportMode) => {
      const imported = parsedRowsToDraftItems(rows)
      const merged = importMode === 'replace' ? imported : [...items, ...imported]
      const nextItems = merged.map((x, i) => ({ ...x, order: i + 1 }))
      const nextLeaderNames = collectLeadersFromItems(
        leaderNames,
        imported.map((it) => it.leaderName),
      )

      setItems(nextItems)
      setLeaderNames(nextLeaderNames)
      if (imported[0]) setNewlyAddedId(imported[0].id)

      const nextDraft = {
        title,
        date,
        plannedStartTime,
        settings,
        leaderNames: nextLeaderNames,
        items: nextItems,
      }

      if (session) {
        session.replaceSetupDraft(nextDraft)
      }

      if (productionMode) {
        void reconcileRuntime(nextItems, { type: 'import', mode: importMode })
      }
    },
    [
      date,
      items,
      leaderNames,
      plannedStartTime,
      productionMode,
      reconcileRuntime,
      session,
      settings,
      title,
    ],
  )

  const onResetConfirm = () => {
    if (productionMode && livePhase === 'running') {
      setResetModalOpen(false)
      return
    }
    const nextItems: DraftItem[] = []
    setItems([])
    setNewlyAddedId(null)
    setResetModalOpen(false)

    const emptyDraft = {
      title,
      date,
      plannedStartTime,
      settings,
      leaderNames,
      items: nextItems,
    }

    if (session) {
      session.replaceSetupDraft(emptyDraft)
    }

    if (productionMode) {
      void reconcileRuntime(nextItems, { type: 'reset' })
    }
  }

  const saving = autoSaving || startSaving || manualSaving || navSaving
  const saveDisabled =
    saving || (!isDirty && Boolean(routeEventId ?? lastEventId))

  const validateTitle = (): boolean => {
    if (title.trim()) {
      setTitleError(null)
      return true
    }
    setTitleError(t('setup.titleRequired'))
    return false
  }

  const onStartControl = async () => {
    if (!canStart || !validateTitle()) return
    setStartSaving(true)
    cancelScheduled()
    try {
      const reuseCloudId =
        isEdit &&
        routeEventId &&
        lastEventId === routeEventId &&
        !isOfflineEventId(lastEventId)
      const touchRuntime = cloudMode ? !reuseCloudId : false
      const result = await flush(touchRuntime)
      const eventId = result?.cloudEventId ?? result?.localId
      if (eventId) startWithEventId(eventId)
    } finally {
      setStartSaving(false)
    }
  }

  const displayTitle = title.trim() || t('event.untitled')

  const {
    leaveModalOpen,
    leaveModalTitle,
    requestLeave,
    confirmGoToLibrary,
    endControlAndLeave,
    cancelLeave,
    leaveDestinationKey,
  } = useLeaveControl(productionMode)

  const hasUnsavedChanges = useCallback(
    () => needsSetupPersistBeforeNav(session, saveStatus, items) || isDirty,
    [isDirty, items, saveStatus, session],
  )

  const ensureSaved = useCallback(async (): Promise<string | null> => {
    if (!hasUnsavedChanges()) {
      return routeEventId ?? lastEventId ?? null
    }
    setNavSaving(true)
    try {
      const result = await flush(false)
      if (!result || result.isError) return null
      const navId = result.cloudEventId ?? result.localId ?? routeEventId ?? lastEventId ?? null
      if (needsInitialEventId && !routeEventId && navId) {
        nav(`/setup/${navId}`, { replace: true })
      }
      return navId
    } finally {
      setNavSaving(false)
    }
  }, [
    flush,
    hasUnsavedChanges,
    lastEventId,
    nav,
    needsInitialEventId,
    routeEventId,
  ])

  const onSave = useCallback(async () => {
    setManualSaving(true)
    try {
      const result = await flush(false)
      if (needsInitialEventId) {
        const navId = result?.cloudEventId ?? result?.localId
        if (navId) nav(`/setup/${navId}`, { replace: true })
      }
    } finally {
      setManualSaving(false)
    }
  }, [flush, nav, needsInitialEventId])

  const openControlRoom = useCallback(async () => {
    const eventId = await ensureSaved()
    if (!eventId) return
    nav(`/start/${eventId}`)
  }, [ensureSaved, nav])

  const openStageView = useCallback(async () => {
    const eventId = await ensureSaved()
    if (!eventId) return
    nav(getOutputLink(eventId, 'stage').path)
  }, [ensureSaved, nav])

  const onLibraryNavigate = useCallback(async () => {
    const saved = await ensureSaved()
    if (hasUnsavedChanges() && !saved) return
    if (productionMode) {
      requestLeave()
    } else {
      nav('/services')
    }
  }, [ensureSaved, hasUnsavedChanges, nav, productionMode, requestLeave])

  const handleLeaveToLibrary = useCallback(async () => {
    const saved = await ensureSaved()
    if (hasUnsavedChanges() && !saved) return
    requestLeave()
  }, [ensureSaved, hasUnsavedChanges, requestLeave])

  const controlShellNavProps = setupEventId
    ? {
        onControlNavigate: openControlRoom,
        controlNavigateDisabled: saving,
        onStageNavigate: openStageView,
        stageNavigateDisabled: saving,
      }
    : {}

  return (
    <ControlShell
      activeNav="setup"
      eventId={setupEventId}
      eventTitle={title}
      timelineAvailable={Boolean(date.trim() && plannedStartTime.trim())}
      productionMode={productionMode}
      sessionStatus={{
        eventId: setupEventId,
        productionMode,
        eventTitle: title,
      }}
      onLeaveToLibrary={() => void handleLeaveToLibrary()}
      footer={
        <SetupFormStatusBar
          isDirty={isDirty}
          saveStatus={saveStatus}
          saveNotice={saveNotice}
        />
      }
      {...controlShellNavProps}
      aside={
        <>
          <SetupEventDetailsCard
            title={title}
            titleError={titleError}
            date={date}
            plannedStartTime={plannedStartTime}
            onTitleChange={(value) => {
              setTitle(value)
              if (titleError && value.trim()) setTitleError(null)
            }}
            onDateChange={setDate}
            onPlannedStartTimeChange={setPlannedStartTime}
          />
          <SetupAsidePanel
            settings={settings}
            onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
            canStart={canStart}
            saving={saving}
            saveStatus={saveStatus}
            saveNotice={saveNotice}
            productionMode={productionMode}
            cloudReady={cloudReady && isPaid}
            hasUid={Boolean(uid)}
            showCloudHints={isPaid}
            onStartControl={() => void onStartControl()}
          />
        </>
      }
    >
      <div className="setupPage">
        <header className="setupPageHeader">
          <div className="setupPageHeaderText">
            <h1 className="setupPageTitle">{t('setup.pageTitle')}</h1>
            <p className="setupPageDesc">{t('setup.desc', { title: displayTitle })}</p>
          </div>
          <div className="setupToolbar" role="toolbar" aria-label={t('nav.programSetup')}>
            {isPaid ? (
              <>
                <div className="setupToolbarGroup">
                  <button
                    className="btnGhost setupToolbarBtn btnWithIcon"
                    type="button"
                    onClick={() => void onLibraryNavigate()}
                  >
                    <BookIcon />
                    <span>{t('nav.library')}</span>
                  </button>
                </div>
                <span className="setupToolbarDivider" aria-hidden />
              </>
            ) : null}
            <div className="setupToolbarGroup">
              <button
                className="btnPrimary controlTopActionBtn setupToolbarBtn btnWithIcon"
                type="button"
                onClick={() => void onSave()}
                disabled={saveDisabled}
              >
                <SaveIcon />
                <span>{saving ? t('setup.saving') : t('setup.save')}</span>
              </button>
              <button
                className="btnGhost controlTopActionBtn setupToolbarBtn setupToolbarBtnDanger btnWithIcon"
                type="button"
                onClick={onResetClick}
                disabled={!items.length || (productionMode && livePhase === 'running')}
                title={productionMode && livePhase === 'running' ? t('setup.resetBlockedRunning') : undefined}
              >
                <RotateCcwIcon />
                <span>{t('setup.reset')}</span>
              </button>
            </div>
          </div>
        </header>

        {loadError ? <p className="saveNotice saveNoticeError">{loadError}</p> : null}

        <section className="card setupProgramCard">
          <div className="setupProgramHead">
            <div className="setupProgramHeadText">
              <h2 className="setupProgramTitle">{t('setup.programItems')}</h2>
              <p className="setupProgramMeta muted">{t('setup.itemCount', { count: items.length })}</p>
            </div>
            <div className="setupProgramStats">
              <div className="setupDurationChip">
                <span className="setupDurationChipLabel">{t('setup.totalDuration')}</span>
                <span className="setupDurationChipValue timeMono">{totalLabel}</span>
              </div>
              {plannedSchedule.enabled ? (
                <div className="setupDurationChip setupEndsChip">
                  <span className="setupDurationChipLabel">{t('setup.programEnd')}</span>
                  <span className="setupDurationChipValue timeMono">
                    {plannedSchedule.programEndLabel}
                  </span>
                </div>
              ) : null}
              <button
                className="btnGhost btnWithIcon"
                type="button"
                onClick={() => setImportOpen(true)}
              >
                <TableIcon />
                <span>{t('setup.import')}</span>
              </button>
              <button className="btnPrimary btnWithIcon" type="button" onClick={onAdd}>
                <PlusIcon />
                <span>{t('setup.addItem')}</span>
              </button>
            </div>
          </div>
          <div className="setupProgramTableScroll">
            <SetupSegmentList
              items={items}
              eventDate={date}
              plannedStartTime={plannedStartTime}
              autoFocusId={autoFocusId}
              onAutoFocusDone={onAutoFocusDone}
              liveIndex={productionMode ? liveIndex : null}
              livePhase={productionMode ? livePhase : null}
              liveDotTheme={productionMode ? liveDotTheme : null}
              liveServiceEnded={productionMode ? (liveRuntime?.serviceEnded ?? false) : false}
              reorderDisabled={productionMode && livePhase === 'running'}
              reorderDisabledTitle={t('setup.reorderBlockedRunning')}
              onReorder={onReorder}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          </div>
        </section>
      </div>

      <SpreadsheetImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={onSpreadsheetImport}
        timerRunning={productionMode && livePhase === 'running'}
      />

      <ConfirmModal
        open={resetModalOpen}
        title={t('setup.resetTitle')}
        body={t('setup.resetBody')}
        confirmLabel={t('setup.resetConfirm')}
        variant="danger"
        onConfirm={onResetConfirm}
        onCancel={() => setResetModalOpen(false)}
      />

      <LeaveControlModal
        open={leaveModalOpen}
        title={leaveModalTitle}
        leaveDestinationKey={leaveDestinationKey}
        onGoToServices={confirmGoToLibrary}
        onEndControl={endControlAndLeave}
        onCancel={cancelLeave}
      />
    </ControlShell>
  )
}

function useNowMs(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
