import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ControlShell } from '../components/ControlShell'
import { EventLinks } from '../components/EventLinks'
import { SetupAsidePanel } from '../components/SetupAsidePanel'
import { SetupSegmentList, type DraftItem } from '../components/SetupSegmentList'
import {
  DEFAULT_EVENT_DISPLAY_SETTINGS,
  type EventDisplaySettings,
  type ProgramItem,
  type WorshipEvent,
} from '../domain/types'
import { formatSecToHhMmSs } from '../domain/time'
import { useAuth } from '../hooks/useAuth'
import { isOfflineEventId } from '../lib/eventSource'
import { hasFirebaseConfig } from '../lib/firebase'
import { addLeaderToRoster, collectLeadersFromItems } from '../lib/leaders'
import {
  getLocalEvent,
  isLibraryEventId,
  newLocalLibraryId,
  upsertLocalEvent,
} from '../lib/localLibrary'
import { encodeLocalEventId } from '../lib/localPayload'
import { loadEvent, loadProgramItems, upsertEventWithItems } from '../lib/firestoreRepo'
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
  const { uid, ready: authReady } = useAuth()
  const isEdit = mode === 'edit' && Boolean(routeEventId)
  const cloudMode = hasFirebaseConfig() && Boolean(uid)

  const [title, setTitle] = useState('รอบนมัสการ')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [settings, setSettings] = useState<EventDisplaySettings>(DEFAULT_EVENT_DISPLAY_SETTINGS)
  const [leaderNames, setLeaderNames] = useState<string[]>([])
  const [items, setItems] = useState<DraftItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

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
          if (!entry) throw new Error('ไม่พบรอบในเครื่อง')
          if (cancelled) return
          setTitle(entry.event.title)
          setDate(entry.event.date)
          setSettings({ ...DEFAULT_EVENT_DISPLAY_SETTINGS, ...entry.event.settings })
          setLeaderNames(entry.event.leaderNames ?? [])
          setItems(programToDraftItems(entry.items))
          setLastEventId(routeEventId)
          return
        }

        if (routeEventId.startsWith('local-')) {
          setLoadError('ลิงก์ Local แบบเก่า — สร้างรอบใหม่แล้วบันทึกในไลบรารี')
          return
        }

        if (cloudReady && uid) {
          const ev = await loadEvent(routeEventId)
          if (!ev) throw new Error('ไม่พบรอบใน Cloud')
          const programItems = await loadProgramItems(routeEventId)
          if (cancelled) return
          setTitle(ev.data.title)
          setDate(ev.data.date)
          setSettings({ ...DEFAULT_EVENT_DISPLAY_SETTINGS, ...ev.data.settings })
          setLeaderNames(ev.data.leaderNames ?? [])
          setItems(programToDraftItems(programItems))
          setLastEventId(routeEventId)
          return
        }

        throw new Error('เข้าสู่ระบบเพื่อแก้ไขรอบ Cloud')
      } catch (e) {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'โหลดไม่สำเร็จ')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [routeEventId, authReady, cloudReady, uid])

  const buildEvent = (roster: string[]): WorshipEvent => ({
    title,
    date,
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
        name: 'รายการใหม่',
        leaderName: '',
        durationSec: 300,
      },
    ])
    setSelectedId(id)
  }

  const onClearAll = () => {
    if (!items.length) return
    if (!confirm('ลบรายการทั้งหมด?')) return
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

  const persistCloud = async (): Promise<string | null> => {
    if (!cloudMode || !uid) return null
    const reuseCloudId =
      isEdit && routeEventId && lastEventId === routeEventId && !isOfflineEventId(lastEventId)
    const eventId = reuseCloudId ? lastEventId! : newCloudEventId()
    const roster = collectLeadersFromItems(
      leaderNames,
      items.map((it) => it.leaderName),
    )
    const programItems = buildProgramItems()
    await upsertEventWithItems({
      eventId,
      event: buildEvent(roster),
      items: programItems,
      initialState: initialRuntimeState({ items: programItems }),
    })
    setLastEventId(eventId)
    return eventId
  }

  const onSave = async () => {
    if (!canStart) return
    setSaving(true)
    setSaveNotice(null)
    try {
      if (cloudMode) {
        const eventId = await persistCloud()
        if (eventId) {
          setSaveNotice('บันทึก Cloud แล้ว')
          if (!isEdit) nav(`/setup/${eventId}`, { replace: true })
        }
      } else {
        const id = persistLocal()
        setSaveNotice('บันทึกในเครื่องแล้ว')
        if (!isEdit) nav(`/setup/${id}`, { replace: true })
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ'
      setSaveNotice(
        msg.includes('permission') || msg.includes('PERMISSION')
          ? 'บันทึก Cloud ไม่สำเร็จ — ต้องมีสิทธิ์ controller ใน Firebase'
          : msg,
      )
    } finally {
      setSaving(false)
    }
  }

  const onStartLocalDemo = () => {
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
    if (!canStart) return
    setSaving(true)
    try {
      if (cloudMode) {
        const eventId = await persistCloud()
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
  const saveLabel = cloudMode ? 'บันทึก Cloud' : 'บันทึกในเครื่อง'

  if (loading) {
    return (
      <ControlShell activeNav="setup" eventId={shellEventId} eventTitle={title}>
        <p className="muted">กำลังโหลดโปรแกรม…</p>
      </ControlShell>
    )
  }

  return (
    <ControlShell
      activeNav="setup"
      eventId={shellEventId}
      eventTitle={title}
      aside={
        <SetupAsidePanel
          settings={settings}
          onSettingsChange={(patch) => setSettings((s) => ({ ...s, ...patch }))}
        />
      }
    >
      <header className="setupPageHeader">
        <div className="setupPageHeaderText">
          <h1 className="setupPageTitle">{isEdit ? 'แก้ไขโปรแกรม' : 'ตั้งค่าโปรแกรม'}</h1>
          <p className="setupPageDesc">กำหนดรายการและเวลาสำหรับ «{title}»</p>
        </div>
        <div className="setupHeaderActions">
          <Link className="btnGhost" to="/services">
            รายการนมัสการ
          </Link>
          <button className="btnGhost" type="button" onClick={onClearAll} disabled={!items.length}>
            ล้างทั้งหมด
          </button>
          <button
            className="btn"
            type="button"
            disabled={!canStart || saving}
            onClick={() => void onSave()}
          >
            {saving ? 'กำลังบันทึก…' : saveLabel}
          </button>
          <button className="btnPrimary" type="button" onClick={onAdd}>
            + เพิ่มรายการ
          </button>
        </div>
      </header>

      {loadError ? <p className="saveNotice saveNoticeError">{loadError}</p> : null}

      <section className="card">
        <div className="grid2">
          <label className="field">
            <div className="label">ชื่องาน</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="field">
            <div className="label">วันที่</div>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
      </section>

      <div className="durationSummaryBar">
        <span className="durationSummaryLabel">
          <span aria-hidden>🕐</span> รวมเวลาโปรแกรม
        </span>
        <span className="durationSummaryValue timeMono">{totalLabel}</span>
      </div>

      <SetupSegmentList
        items={items}
        selectedId={selectedId}
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
          <h2 className="cardTitle">เริ่มงาน</h2>
        </div>
        <div className="stack">
          <button
            className="btnPrimary"
            type="button"
            disabled={!canStart || saving}
            onClick={() => void onStartControl()}
          >
            {saving ? 'กำลังเตรียม…' : 'เริ่มควบคุม'}
          </button>
          {!cloudMode && cloudReady ? (
            <button className="btn" type="button" disabled={!canStart} onClick={onStartLocalDemo}>
              เริ่ม (Local URL แบบเก่า)
            </button>
          ) : null}
          {cloudReady && !uid ? (
            <div className="muted">เข้าสู่ระบบที่หน้ารายการนมัสการเพื่อบันทึก Cloud</div>
          ) : null}
          {!cloudReady ? (
            <div className="muted">
              Cloud: สร้าง <code>.env.local</code> จาก <code>.env.example</code> เพื่อบันทึกและ sync
              realtime
            </div>
          ) : null}
        </div>
      </section>

      {isEdit && lastEventId ? (
        <section className="card">
          <div className="cardHeader">
            <h2 className="cardTitle">ลิงก์แยกจอ</h2>
          </div>
          <EventLinks eventId={lastEventId} />
        </section>
      ) : null}

      <footer className="footer">
        <div className="muted">
          <Link to="/services">รายการนมัสการ</Link> · Controller:{' '}
          <code>/start/&lt;eventId&gt;</code> · Stage: <code>/view/&lt;eventId&gt;?kiosk=1</code>
        </div>
      </footer>
    </ControlShell>
  )
}
