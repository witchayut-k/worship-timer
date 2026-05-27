import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, Navigate } from 'react-router-dom'
import { usePlan } from '../context/PlanProvider'
import { ensureFreeSession, freeSessionSetupPath, isFreeSessionId } from '../lib/freeSession'
import { ConfirmModal } from '../components/ConfirmModal'
import { ControlShell } from '../components/ControlShell'
import { LeaveControlModal } from '../components/LeaveControlModal'
import { SetupAsidePanel } from '../components/SetupAsidePanel'
import {
  SpreadsheetImportModal,
  type SpreadsheetImportMode,
} from '../components/SpreadsheetImportModal'
import { SetupSegmentList, type DraftItem } from '../components/SetupSegmentList'
import { BookIcon, PlusIcon, RotateCcwIcon, SlidersIcon } from '../components/SetupIcons'
import type { ParsedProgramRow } from '../domain/spreadsheetImport'
import {
  DEFAULT_EVENT_DISPLAY_SETTINGS,
  type EventDisplaySettings,
  type ProgramItem,
  type WorshipEvent,
} from '../domain/types'
import { formatSecToHhMmSs } from '../domain/time'
import { useActiveControl } from '../hooks/useActiveControl'
import { useAuth } from '../hooks/useAuth'
import { useLeaveControl } from '../hooks/useLeaveControl'
import { useLocale } from '../i18n/useLocale'
import { isOfflineEventId } from '../lib/eventSource'
import { loadStoredLocalRuntime, subscribeLocalRuntime } from '../lib/localSync'
import { hasFirebaseConfig } from '../lib/firebase'
import { addLeaderToRoster, collectLeadersFromItems } from '../lib/leaders'
import {
  getLocalEvent,
  isLibraryEventId,
  newLocalLibraryId,
  upsertLocalEvent,
} from '../lib/localLibrary'
import {
  loadEvent,
  loadProgramItems,
  upsertEventProgram,
  upsertEventWithItems,
  watchRuntimeState,
} from '../lib/firestoreRepo'
import { initialRuntimeState } from '../lib/runtimeEngine'

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function newCloudEventId(): string {
  return `evt-${Date.now().toString(36)}`
}

function programToDraftItems(items: ProgramItem[]): DraftItem[] {
  return items.map((it) => ({
    id: newId(),
    order: it.order,
    name: it.name,
    leaderName: it.leaderName,
    durationSec: it.durationSec,
    roomLights: it.roomLights ?? '',
    mediaNote: it.mediaNote ?? '',
  }))
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
  return <SetupPageInner key={mode === 'new' ? 'new' : routeEventId} mode={mode} routeEventId={routeEventId} />
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
  const { isFree, isPaid, freeSessionId } = usePlan()
  const isEdit = mode === 'edit' && Boolean(routeEventId)
  const cloudMode = isPaid && hasFirebaseConfig() && Boolean(uid)

  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [plannedStartTime, setPlannedStartTime] = useState('')
  const [settings, setSettings] = useState<EventDisplaySettings>(DEFAULT_EVENT_DISPLAY_SETTINGS)
  const [leaderNames, setLeaderNames] = useState<string[]>([])
  const [items, setItems] = useState<DraftItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [newlyAddedId, setNewlyAddedId] = useState<string | null>(null)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [resetModalOpen, setResetModalOpen] = useState(false)
  const [liveIndex, setLiveIndex] = useState<number | null>(null)

  const canStart = useMemo(() => items.length > 0, [items.length])
  const cloudReady = hasFirebaseConfig()
  const totalSec = useMemo(() => items.reduce((s, it) => s + it.durationSec, 0), [items])
  const totalLabel = formatSecToHhMmSs(totalSec)

  useEffect(() => {
    if (isFree) ensureFreeSession()
  }, [isFree])

  useEffect(() => {
    if (!routeEventId || !authReady) {
      if (!routeEventId) setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setLoadError(null)

    const load = async () => {
      try {
        if (isFree && routeEventId && isFreeSessionId(routeEventId)) {
          ensureFreeSession()
        }
        if (isLibraryEventId(routeEventId)) {
          const entry = getLocalEvent(routeEventId)
          if (!entry) throw new Error(t('setup.loadLocalNotFound'))
          if (cancelled) return
          setTitle(entry.event.title)
          setDate(entry.event.date)
          setPlannedStartTime(entry.event.plannedStartTime ?? '')
          setSettings({ ...DEFAULT_EVENT_DISPLAY_SETTINGS, ...entry.event.settings })
          setLeaderNames(entry.event.leaderNames ?? [])
          setItems(programToDraftItems(entry.items))
          setLastEventId(routeEventId)
          return
        }

        if (routeEventId.startsWith('local-')) {
          setLoadError(t('setup.loadLegacyLocal'))
          return
        }

        if (cloudReady && uid) {
          const ev = await loadEvent(routeEventId)
          if (!ev) throw new Error(t('setup.loadCloudNotFound'))
          const programItems = await loadProgramItems(routeEventId)
          if (cancelled) return
          setTitle(ev.data.title)
          setDate(ev.data.date)
          setPlannedStartTime(ev.data.plannedStartTime ?? '')
          setSettings({ ...DEFAULT_EVENT_DISPLAY_SETTINGS, ...ev.data.settings })
          setLeaderNames(ev.data.leaderNames ?? [])
          setItems(programToDraftItems(programItems))
          setLastEventId(routeEventId)
          return
        }

        throw new Error(t('setup.loadSignInRequired'))
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : t('setup.loadFailed'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [routeEventId, authReady, cloudReady, t, uid, isFree])

  useEffect(() => {
    if (loading || focusOrder == null || !items.length) return
    const match = items.find((it) => it.order === focusOrder)
    if (match) setSelectedId(match.id)
  }, [loading, focusOrder, items])

  useEffect(() => {
    const eid = routeEventId ?? lastEventId
    if (!eid) return

    if (isOfflineEventId(eid)) {
      const stored = loadStoredLocalRuntime(eid)
      if (stored) setLiveIndex(stored.currentIndex)
      return subscribeLocalRuntime(eid, (s) => setLiveIndex(s.currentIndex))
    }

    if (cloudReady && uid) {
      return watchRuntimeState(eid, (s) => {
        if (s) setLiveIndex(s.currentIndex)
      })
    }
  }, [routeEventId, lastEventId, cloudReady, uid])

  useEffect(() => {
    if (loading || focusOrder != null || liveIndex == null || !items.length) return
    const match = items[liveIndex]
    if (match) setSelectedId(match.id)
  }, [loading, focusOrder, liveIndex, items])

  const buildEvent = (roster: string[]): WorshipEvent => ({
    title,
    date,
    ...(plannedStartTime.trim() ? { plannedStartTime: plannedStartTime.trim() } : {}),
    status: 'active',
    updatedAtMs: Date.now(),
    settings,
    leaderNames: roster,
    ...(uid ? { ownerUid: uid } : {}),
  })

  const buildProgramItems = (): ProgramItem[] =>
    items.map((it) => ({
      order: it.order,
      name: it.name,
      leaderName: it.leaderName,
      durationSec: it.durationSec,
    }))

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
    setSelectedId(id)
    setNewlyAddedId(id)
  }

  const onResetClick = () => {
    if (!items.length) return
    setResetModalOpen(true)
  }

  const onResetConfirm = () => {
    setItems([])
    setSelectedId(null)
    setResetModalOpen(false)
  }

  const onRemove = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id).map((x, i) => ({ ...x, order: i + 1 })))
    setSelectedId((cur) => (cur === id ? null : cur))
    setNewlyAddedId((cur) => (cur === id ? null : cur))
  }

  const onUpdate = (id: string, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const onLeaderCommit = (name: string) => {
    setLeaderNames((prev) => addLeaderToRoster(prev, name))
  }

  const onSpreadsheetImport = (rows: ParsedProgramRow[], importMode: SpreadsheetImportMode) => {
    const imported = parsedRowsToDraftItems(rows)
    setItems((prev) => {
      const merged = importMode === 'replace' ? imported : [...prev, ...imported]
      return merged.map((x, i) => ({ ...x, order: i + 1 }))
    })
    setLeaderNames((prev) =>
      collectLeadersFromItems(
        prev,
        imported.map((it) => it.leaderName),
      ),
    )
    setSelectedId(imported[0]?.id ?? null)
  }

  const startWithEventId = (eventId: string) => {
    setLastEventId(eventId)
    nav(`/start/${eventId}`)
  }

  const persistLocal = (): string => {
    const roster = collectLeadersFromItems(
      leaderNames,
      items.map((it) => it.leaderName),
    )
    const programItems = buildProgramItems()
    const reuseLocalId =
      !isFree &&
      isEdit &&
      routeEventId &&
      lastEventId === routeEventId &&
      isLibraryEventId(lastEventId)
    const id = upsertLocalEvent({
      id: isFree ? freeSessionId : reuseLocalId ? lastEventId! : newLocalLibraryId(),
      event: buildEvent(roster),
      items: programItems,
    })
    setLastEventId(id)
    return id
  }

  const persistCloud = async (touchRuntime: boolean): Promise<string | null> => {
    if (!cloudMode || !uid) return null
    const reuseCloudId =
      isEdit && routeEventId && lastEventId === routeEventId && !isOfflineEventId(lastEventId)
    const eventId = reuseCloudId ? lastEventId! : newCloudEventId()
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

  const validateTitle = (): boolean => {
    if (title.trim()) {
      setTitleError(null)
      return true
    }
    setTitleError(t('setup.titleRequired'))
    return false
  }

  const onSave = async () => {
    if (!canStart || !validateTitle()) return
    setSaving(true)
    setSaveNotice(null)
    try {
      let cloudEventId: string | null = null
      if (cloudMode) {
        cloudEventId = await persistCloud(!isEdit)
      }
      const localId = persistLocal()
      if (cloudEventId) {
        setSaveNotice(t('setup.savedSynced'))
        if (!isEdit) nav(`/setup/${cloudEventId}`, { replace: true })
      } else {
        setSaveNotice(t('setup.saved'))
        if (!isEdit) nav(`/setup/${localId}`, { replace: true })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('setup.saveFailed')
      const isPermission =
        msg.includes('permission') || msg.includes('PERMISSION')
      try {
        persistLocal()
        setSaveNotice(
          isPermission ? t('setup.savedLocalCloudFailed') : t('setup.saved'),
        )
      } catch {
        setSaveNotice(isPermission ? t('setup.saveCloudPermission') : msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const onStartControl = async () => {
    if (!canStart || !validateTitle()) return
    setSaving(true)
    try {
      if (cloudMode) {
        const reuseCloudId =
          isEdit && routeEventId && lastEventId === routeEventId && !isOfflineEventId(lastEventId)
        const eventId = await persistCloud(!reuseCloudId)
        if (eventId) startWithEventId(eventId)
        return
      }
      const id = persistLocal()
      startWithEventId(id)
    } finally {
      setSaving(false)
    }
  }

  const shellEventId = lastEventId
  const displayTitle = title.trim() || t('event.untitled')
  const productionMode = isProductionForEvent(shellEventId)
  const controlEventId = productionMode ? shellEventId : null
  const {
    leaveModalOpen,
    leaveModalTitle,
    requestLeave,
    confirmGoToLibrary,
    endControlAndLeave,
    cancelLeave,
    leaveDestinationKey,
  } = useLeaveControl(productionMode)

  if (isFree && routeEventId && !isFreeSessionId(routeEventId)) {
    return <Navigate to={freeSessionSetupPath()} replace />
  }

  if (loading) {
    return (
      <ControlShell activeNav="setup" eventId={shellEventId} eventTitle={title}>
        <p className="muted">{t('setup.loadingProgram')}</p>
      </ControlShell>
    )
  }

  return (
    <ControlShell
      activeNav="setup"
      eventId={shellEventId}
      eventTitle={title}
      productionMode={productionMode}
      onLeaveToLibrary={requestLeave}
      aside={
        <SetupAsidePanel
          settings={settings}
          onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          onOpenSpreadsheetImport={() => setImportOpen(true)}
          canStart={canStart}
          saving={saving}
          saveNotice={saveNotice}
          productionMode={productionMode}
          cloudReady={cloudReady && isPaid}
          hasUid={Boolean(uid)}
          showCloudHints={isPaid}
          onSave={() => void onSave()}
          onStartControl={() => void onStartControl()}
        />
      }
    >
      <div className="setupPage">
        <header className="setupPageHeader">
          <div className="setupPageHeaderText">
            <h1 className="setupPageTitle">{t('setup.pageTitle')}</h1>
            <p className="setupPageDesc">{t('setup.desc', { title: displayTitle })}</p>
          </div>
          <div className="setupToolbar" role="toolbar" aria-label={t('nav.programSetup')}>
            <div className="setupToolbarGroup">
              {controlEventId ? (
                <Link className="btnGhost setupToolbarBtn btnWithIcon" to={`/start/${controlEventId}`}>
                  <SlidersIcon />
                  <span>{t('setup.openControl')}</span>
                </Link>
              ) : null}
              {isPaid ? (
                productionMode ? (
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
                )
              ) : null}
            </div>
            <span className="setupToolbarDivider" aria-hidden />
            <div className="setupToolbarGroup">
              <button
                className="btnGhost setupToolbarBtn setupToolbarBtnDanger btnWithIcon"
                type="button"
                onClick={onResetClick}
                disabled={!items.length}
              >
                <RotateCcwIcon />
                <span>{t('setup.reset')}</span>
              </button>
            </div>
          </div>
        </header>

        {loadError ? <p className="saveNotice saveNoticeError">{loadError}</p> : null}

        <section className="card setupEventCard">
          <div className="cardHeader">
            <h2 className="cardTitle">{t('setup.eventDetails')}</h2>
          </div>
          <div className="setupEventGrid">
            <label className="field setupEventTitleField">
              <div className="label">{t('setup.eventTitle')}</div>
              <input
                value={title}
                placeholder={t('event.titlePlaceholder')}
                aria-invalid={titleError != null}
                onChange={(e) => {
                  setTitle(e.target.value)
                  if (titleError && e.target.value.trim()) setTitleError(null)
                }}
              />
              {titleError ? <p className="fieldError">{titleError}</p> : null}
            </label>
            <label className="field">
              <div className="label">{t('setup.date')}</div>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <label className="field setupEventTimeField">
              <div className="label labelWithTag">
                <span>{t('setup.plannedStart')}</span>
                <span className="labelTag">{t('common.optional')}</span>
              </div>
              <input
                type="time"
                value={plannedStartTime}
                onChange={(e) => setPlannedStartTime(e.target.value)}
              />
            </label>
          </div>
        </section>

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
            selectedId={selectedId}
            autoFocusId={newlyAddedId}
            onAutoFocusDone={() => setNewlyAddedId(null)}
            liveIndex={liveIndex}
            leaderNames={leaderNames}
            onSelect={setSelectedId}
            onReorder={setItems}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onLeaderCommit={onLeaderCommit}
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
