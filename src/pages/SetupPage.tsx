import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { usePlan } from '../context/PlanProvider'
import { ConfirmModal } from '../components/ConfirmModal'
import { ControlShell } from '../components/ControlShell'
import { LeaveControlModal } from '../components/LeaveControlModal'
import { SetupAsidePanel } from '../components/SetupAsidePanel'
import { SetupEventDetailsCard } from '../components/SetupEventDetailsCard'
import {
  SpreadsheetImportModal,
  type SpreadsheetImportMode,
} from '../components/SpreadsheetImportModal'
import { SetupSegmentList, type DraftItem } from '../components/SetupSegmentList'
import { BookIcon, PlusIcon, RotateCcwIcon } from '../components/SetupIcons'
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
  draftProgramContentSnapshot,
  newDraftItemId,
  programItemsContentSnapshot,
  snapshotFromDraftBundle,
} from '../lib/eventSessionDraft'
import { needsSetupPersistBeforeNav } from '../lib/setupNavigation'
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
import { syncRuntimeState } from '../lib/syncRuntimeState'

function newId(): string {
  return newDraftItemId()
}

function newCloudEventId(): string {
  return `evt-${Date.now().toString(36)}`
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
  const [startSaving, setStartSaving] = useState(false)
  const [navSaving, setNavSaving] = useState(false)
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
    const { remainingSec } = deriveLocalDisplay({ state: liveRuntime, nowMs })
    return getStageTheme({ remainingSec, settings })
  }, [productionMode, liveRuntime, nowMs, settings])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormHydrated(false)
    baselineSeededRef.current = false
  }, [routeEventId])

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
    if (!session || !formHydrated || !session.setupDraft) return
    if (session.isSetupDraftDirty()) return
    const draft = session.setupDraft
    if (
      draftProgramContentSnapshot(draft) ===
      programItemsContentSnapshot(draftItemsToProgramItems(items))
    ) {
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTitle(draft.title)
    setDate(draft.date)
    setPlannedStartTime(draft.plannedStartTime)
    setSettings(draft.settings)
    setLeaderNames(draft.leaderNames)
    setItems(draft.items)
  }, [session, formHydrated, session?.setupDraft, items])

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

  const buildEvent = (roster: string[]): WorshipEvent => ({
    title: title.trim(),
    date,
    ...(plannedStartTime.trim() ? { plannedStartTime: plannedStartTime.trim() } : {}),
    status: 'active',
    updatedAtMs: Date.now(),
    settings,
    leaderNames: roster,
    ...(uid ? { ownerUid: uid } : {}),
  })

  const buildProgramItems = (sourceItems: DraftItem[] = items): ProgramItem[] => draftItemsToProgramItems(sourceItems)

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
    (options: { touchRuntime: boolean }) => Promise<PersistSetupOutcome>
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

  const persistLocal = (): string | null => {
    if (isFree) return null
    const roster = collectLeadersFromItems(
      leaderNames,
      items.map((it) => it.leaderName),
    )
    const programItems = buildProgramItems()
    const reuseLocalId =
      isEdit && routeEventId && lastEventId === routeEventId && isLibraryEventId(lastEventId)
    const id = upsertLocalEvent({
      id: reuseLocalId ? lastEventId! : newLocalLibraryId(),
      event: buildEvent(roster),
      items: programItems,
    })
    setLastEventId(id)
    return id
  }

  const persistCloud = async (touchRuntime: boolean): Promise<string | null> => {
    if (!cloudMode || !uid) return null
    const cloudRouteId =
      routeEventId && !isOfflineEventId(routeEventId) ? routeEventId : null
    const reuseCloudId =
      isEdit && routeEventId && lastEventId === routeEventId && !isOfflineEventId(lastEventId)
    const eventId = cloudRouteId ?? (reuseCloudId ? lastEventId! : newCloudEventId())
    const roster = collectLeadersFromItems(
      leaderNames,
      items.map((it) => it.leaderName),
    )
    const programItems = buildProgramItems()
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
  }

  const persistSetup = useCallback(
    async ({ touchRuntime }: { touchRuntime: boolean }): Promise<PersistSetupOutcome> => {
      try {
        const roster = collectLeadersFromItems(
          leaderNames,
          items.map((it) => it.leaderName),
        )
        const programItems = buildProgramItems()
        const savedEvent = buildEvent(roster)

        let cloudEventId: string | null = null
        if (cloudMode) {
          cloudEventId = await persistCloud(touchRuntime)
        }
        const localId = persistLocal() ?? ''
        if (session) {
          session.notifyProgramPersisted(savedEvent, programItems)
          session.markSetupDraftSaved(
            snapshotFromDraftBundle({
              title,
              date,
              plannedStartTime,
              settings,
              leaderNames,
              items,
            }),
          )
        }
        const notice = cloudEventId ? t('setup.savedSynced') : t('setup.saved')
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
    [cloudMode, persistCloud, persistLocal, t, session, title, date, plannedStartTime, settings, leaderNames, items],
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

  const shouldNavigateAfterSave = !isEdit && !routeEventId

  const {
    saveStatus,
    saveNotice,
    saving: autoSaving,
    flush,
    cancelScheduled,
    markSnapshotSaved,
  } = useSetupAutoSave({
    enabled:
      !isProgramLoading && (items.length > 0 || Boolean(routeEventId ?? lastEventId)),
    hydrated,
    snapshot: setupSnapshot,
    persistSetup,
    shouldNavigateAfterSave,
    onNavigateAfterSave: (eventId) => nav(`/setup/${eventId}`, { replace: true }),
  })

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

  const persistBeforeNav = needsSetupPersistBeforeNav(session, saveStatus, items)

  const onSpreadsheetImport = useCallback(
    (rows: ParsedProgramRow[], importMode: SpreadsheetImportMode) => {
      if (productionMode && livePhase === 'running' && importMode === 'replace') return
      const imported = parsedRowsToDraftItems(rows)
      const merged = importMode === 'replace' ? imported : [...items, ...imported]
      const nextItems = merged.map((x, i) => ({ ...x, order: i + 1 }))
      setItems(nextItems)
      setLeaderNames((prev) =>
        collectLeadersFromItems(
          prev,
          imported.map((it) => it.leaderName),
        ),
      )
      if (imported[0]) setNewlyAddedId(imported[0].id)
      cancelScheduled()
      window.setTimeout(() => {
        void flushRef.current(false)
      }, 0)
      if (productionMode) {
        void reconcileRuntime(nextItems, { type: 'import', mode: importMode })
      }
    },
    [cancelScheduled, items, livePhase, productionMode, reconcileRuntime],
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
    if (!lastEventId && !routeEventId) return
    const emptySnapshot = serializeSetupSnapshot({
      title,
      date,
      plannedStartTime,
      settings,
      leaderNames,
      items: [],
    })
    window.setTimeout(() => {
      void persistSetupRef.current({ touchRuntime: false }).then((result) => {
        if (result && !result.isError) markSnapshotSaved(emptySnapshot)
      })
    }, 0)
    if (productionMode) {
      void reconcileRuntime(nextItems, { type: 'reset' })
    }
  }

  const saving = autoSaving || startSaving || navSaving

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

  const openControlRoom = useCallback(async () => {
    if (!setupEventId) return
    setNavSaving(true)
    cancelScheduled()
    try {
      await flush(false)
    } finally {
      setNavSaving(false)
    }
    nav(`/start/${setupEventId}`)
  }, [setupEventId, cancelScheduled, flush, nav])

  const controlShellNavProps =
    setupEventId && persistBeforeNav
      ? {
          onControlNavigate: openControlRoom,
          controlNavigateDisabled: navSaving,
        }
      : {}

  const {
    leaveModalOpen,
    leaveModalTitle,
    requestLeave,
    confirmGoToLibrary,
    endControlAndLeave,
    cancelLeave,
    leaveDestinationKey,
  } = useLeaveControl(productionMode)

  return (
    <ControlShell
      activeNav="setup"
      eventId={setupEventId}
      eventTitle={title}
      productionMode={productionMode}
      sessionStatus={{
        eventId: setupEventId,
        productionMode,
        eventTitle: title,
      }}
      onLeaveToLibrary={requestLeave}
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
            onOpenSpreadsheetImport={() => setImportOpen(true)}
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
                  {productionMode ? (
                    <button
                      className="btnGhost setupToolbarBtn btnWithIcon"
                      type="button"
                      onClick={requestLeave}
                    >
                      <BookIcon />
                      <span>{t('nav.library')}</span>
                    </button>
                  ) : (
                    <Link className="btnGhost setupToolbarBtn btnWithIcon" to="/services">
                      <BookIcon />
                      <span>{t('nav.library')}</span>
                    </Link>
                  )}
                </div>
                <span className="setupToolbarDivider" aria-hidden />
              </>
            ) : null}
            <div className="setupToolbarGroup">
              <button
                className="btnGhost setupToolbarBtn setupToolbarBtnDanger btnWithIcon"
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
              <button className="btnPrimary btnWithIcon" type="button" onClick={onAdd}>
                <PlusIcon />
                <span>{t('setup.addItem')}</span>
              </button>
            </div>
          </div>
          <SetupSegmentList
            items={items}
            autoFocusId={autoFocusId}
            onAutoFocusDone={onAutoFocusDone}
            liveIndex={productionMode ? liveIndex : null}
            livePhase={productionMode ? livePhase : null}
            liveDotTheme={productionMode ? liveDotTheme : null}
            reorderDisabled={productionMode && livePhase === 'running'}
            reorderDisabledTitle={t('setup.reorderBlockedRunning')}
            onReorder={onReorder}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        </section>
      </div>

      <SpreadsheetImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={onSpreadsheetImport}
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
