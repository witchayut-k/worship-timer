import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ControlShell } from '../components/ControlShell'
import { EventLinks } from '../components/EventLinks'
import { LeaveControlModal } from '../components/LeaveControlModal'
import { SetupAsidePanel } from '../components/SetupAsidePanel'
import {
  SpreadsheetImportModal,
  type SpreadsheetImportMode,
} from '../components/SpreadsheetImportModal'
import { SetupSegmentList, type DraftItem } from '../components/SetupSegmentList'
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
import { encodeLocalEventId } from '../lib/localPayload'
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
  const isEdit = mode === 'edit' && Boolean(routeEventId)
  const cloudMode = hasFirebaseConfig() && Boolean(uid)

  const [title, setTitle] = useState('')
  const [titleError, setTitleError] = useState<string | null>(null)
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [plannedStartTime, setPlannedStartTime] = useState('')
  const [settings, setSettings] = useState<EventDisplaySettings>(DEFAULT_EVENT_DISPLAY_SETTINGS)
  const [leaderNames, setLeaderNames] = useState<string[]>([])
  const [items, setItems] = useState<DraftItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [liveIndex, setLiveIndex] = useState<number | null>(null)

  const canStart = useMemo(() => items.length > 0, [items.length])
  const cloudReady = hasFirebaseConfig()
  const totalSec = useMemo(() => items.reduce((s, it) => s + it.durationSec, 0), [items])
  const totalLabel = formatSecToHhMmSs(totalSec)

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
  }, [routeEventId, authReady, cloudReady, t, uid])

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
    setItems((prev) => [
      ...prev,
      {
        id,
        order: prev.length + 1,
        name: t('setup.newSegment'),
        leaderName: '',
        durationSec: 300,
        roomLights: '',
        mediaNote: '',
      },
    ])
    setSelectedId(id)
  }

  const onClearAll = () => {
    if (!items.length) return
    if (!confirm(t('setup.clearAllConfirm'))) return
    setItems([])
    setSelectedId(null)
  }

  const onRemove = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id).map((x, i) => ({ ...x, order: i + 1 })))
    setSelectedId((cur) => (cur === id ? null : cur))
  }

  const onUpdate = (id: string, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }

  const onLeaderCommit = (name: string) => {
    setLeaderNames((prev) => addLeaderToRoster(prev, name))
  }

  const onSpreadsheetImport = (rows: ParsedProgramRow[], mode: SpreadsheetImportMode) => {
    const imported = parsedRowsToDraftItems(rows)
    setItems((prev) => {
      const merged = mode === 'replace' ? imported : [...prev, ...imported]
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
      isEdit && routeEventId && lastEventId === routeEventId && isLibraryEventId(lastEventId)
    const id = upsertLocalEvent({
      id: reuseLocalId ? lastEventId : newLocalLibraryId(),
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
      if (cloudMode) {
        const eventId = await persistCloud(!isEdit)
        if (eventId) {
          setSaveNotice(t('setup.savedCloud'))
          if (!isEdit) nav(`/setup/${eventId}`, { replace: true })
        }
      } else {
        const id = persistLocal()
        setSaveNotice(t('setup.savedLocal'))
        if (!isEdit) nav(`/setup/${id}`, { replace: true })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('setup.saveFailed')
      setSaveNotice(
        msg.includes('permission') || msg.includes('PERMISSION')
          ? t('setup.saveCloudPermission')
          : msg,
      )
    } finally {
      setSaving(false)
    }
  }

  const onStartLocalDemo = () => {
    if (!validateTitle()) return
    const roster = collectLeadersFromItems(
      leaderNames,
      items.map((it) => it.leaderName),
    )
    const eventId = encodeLocalEventId({
      event: buildEvent(roster),
      items: buildProgramItems(),
    })
    startWithEventId(eventId)
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
  const saveLabel = cloudMode ? t('setup.saveCloud') : t('setup.saveLocal')
  const displayTitle = title.trim() || t('event.untitled')
  const productionMode = isProductionForEvent(shellEventId)
  const {
    leaveModalOpen,
    leaveModalTitle,
    requestLeave,
    confirmGoToServices,
    endControlAndLeave,
    cancelLeave,
  } = useLeaveControl(productionMode)

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
      onLeaveToServices={requestLeave}
      aside={
        <SetupAsidePanel
          settings={settings}
          onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
          onOpenSpreadsheetImport={() => setImportOpen(true)}
        />
      }
    >
      <header className="setupPageHeader">
        <div className="setupPageHeaderText">
          <h1 className="setupPageTitle">{isEdit ? t('setup.editTitle') : t('setup.newTitle')}</h1>
          <p className="setupPageDesc">{t('setup.desc', { title: displayTitle })}</p>
        </div>
        <div className="setupHeaderActions">
          {lastEventId ? (
            <Link className="btnGhost" to={`/start/${lastEventId}`}>
              {t('setup.backToControl')}
            </Link>
          ) : null}
          {productionMode ? (
            <button className="btnGhost" type="button" onClick={requestLeave}>
              {t('nav.goToServices')}
            </button>
          ) : (
            <Link className="btnGhost" to="/services">
              {t('nav.services')}
            </Link>
          )}
          <button className="btnGhost" type="button" onClick={onClearAll} disabled={!items.length}>
            {t('setup.clearAll')}
          </button>
          <button
            className="btn"
            type="button"
            disabled={!canStart || saving}
            onClick={() => void onSave()}
          >
            {saving ? t('setup.saving') : saveLabel}
          </button>
          <button className="btnPrimary" type="button" onClick={onAdd}>
            {t('setup.addItem')}
          </button>
        </div>
      </header>

      {loadError ? <p className="saveNotice saveNoticeError">{loadError}</p> : null}

      <section className="card">
        <div className="grid2">
          <label className="field">
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
        </div>
        <label className="field" style={{ marginTop: 10 }}>
          <div className="label">{t('setup.plannedStart')}</div>
          <input
            type="time"
            value={plannedStartTime}
            onChange={(e) => setPlannedStartTime(e.target.value)}
          />
        </label>
      </section>

      <div className="durationSummaryBar">
        <span className="durationSummaryLabel">
          <span aria-hidden>🕐</span> {t('setup.totalDuration')}
        </span>
        <span className="durationSummaryValue timeMono">{totalLabel}</span>
      </div>

      <SetupSegmentList
        items={items}
        selectedId={selectedId}
        liveIndex={liveIndex}
        leaderNames={leaderNames}
        onSelect={setSelectedId}
        onReorder={setItems}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onLeaderCommit={onLeaderCommit}
      />

      {saveNotice ? <p className="saveNotice">{saveNotice}</p> : null}

      <section className="card">
        <div className="cardHeader">
          <h2 className="cardTitle">{t('setup.startSection')}</h2>
        </div>
        <div className="stack">
          <button
            className="btnPrimary"
            type="button"
            disabled={!canStart || saving}
            onClick={() => void onStartControl()}
          >
            {saving ? t('setup.preparing') : t('setup.startControl')}
          </button>
          {!cloudMode && cloudReady ? (
            <button className="btn" type="button" disabled={!canStart} onClick={onStartLocalDemo}>
              {t('setup.startLocalLegacy')}
            </button>
          ) : null}
          {cloudReady && !uid ? (
            <div className="muted">{t('setup.signInForCloud')}</div>
          ) : null}
          {!cloudReady ? (
            <div className="muted">
              {t('setup.cloudEnvHint', { envFile: '.env.local', envExample: '.env.example' })}
            </div>
          ) : null}
        </div>
      </section>

      {isEdit && lastEventId ? (
        <section className="card">
          <div className="cardHeader">
            <h2 className="cardTitle">{t('setup.outputLinks')}</h2>
          </div>
          <EventLinks eventId={lastEventId} />
        </section>
      ) : null}

      <SpreadsheetImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={onSpreadsheetImport}
      />

      <LeaveControlModal
        open={leaveModalOpen}
        title={leaveModalTitle}
        onGoToServices={confirmGoToServices}
        onEndControl={endControlAndLeave}
        onCancel={cancelLeave}
      />
    </ControlShell>
  )
}
