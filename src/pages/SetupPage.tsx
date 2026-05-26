import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { addLeaderToRoster, collectLeadersFromItems } from '../lib/leaders'
import { encodeLocalEventId } from '../lib/localPayload'
import { hasFirebaseConfig } from '../lib/firebase'
import { upsertEventWithItems } from '../lib/firestoreRepo'
import { initialRuntimeState } from '../lib/runtimeEngine'

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function newCloudEventId(): string {
  return `evt-${Date.now().toString(36)}`
}

export function SetupPage() {
  const nav = useNavigate()
  const [title, setTitle] = useState('รอบนมัสการ')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [settings, setSettings] = useState<EventDisplaySettings>(DEFAULT_EVENT_DISPLAY_SETTINGS)
  const [leaderNames, setLeaderNames] = useState<string[]>([])
  const [items, setItems] = useState<DraftItem[]>(() => [
    { id: newId(), order: 1, name: 'นับถอยก่อนเริ่ม', leaderName: 'ทีมสื่อ', durationSec: 300 },
    { id: newId(), order: 2, name: 'ร้องเพลง', leaderName: 'วงนำสวด', durationSec: 900 },
    { id: newId(), order: 3, name: 'ต้อนรับและประกาศ', leaderName: '', durationSec: 300 },
    { id: newId(), order: 4, name: 'คำเทศนา', leaderName: '', durationSec: 2700 },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [lastEventId, setLastEventId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveNotice, setSaveNotice] = useState<string | null>(null)

  const canStart = useMemo(() => items.length > 0, [items.length])
  const cloudReady = hasFirebaseConfig()
  const totalSec = useMemo(() => items.reduce((s, it) => s + it.durationSec, 0), [items])
  const totalLabel = formatSecToHhMmSs(totalSec)

  const buildEvent = (roster: string[]): WorshipEvent => ({
    title,
    date,
    status: 'active',
    updatedAtMs: Date.now(),
    settings,
    leaderNames: roster,
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

  const persistCloud = async (): Promise<string | null> => {
    if (!cloudReady) return null
    const eventId = lastEventId && !lastEventId.startsWith('local-') ? lastEventId : newCloudEventId()
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

  const onSaveToCloud = async () => {
    if (!cloudReady || !canStart) return
    setSaving(true)
    setSaveNotice(null)
    try {
      const eventId = await persistCloud()
      if (eventId) setSaveNotice('บันทึก Cloud แล้ว — กด «เริ่มควบคุม» เมื่อพร้อม')
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
    if (cloudReady && lastEventId && !lastEventId.startsWith('local-')) {
      setSaving(true)
      try {
        await persistCloud()
        startWithEventId(lastEventId)
      } finally {
        setSaving(false)
      }
      return
    }
    if (cloudReady && (!lastEventId || lastEventId.startsWith('local-'))) {
      setSaving(true)
      try {
        const eventId = await persistCloud()
        if (eventId) startWithEventId(eventId)
      } finally {
        setSaving(false)
      }
      return
    }
    onStartLocalDemo()
  }

  const shellEventId = lastEventId

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
          <h1 className="setupPageTitle">ตั้งค่าโปรแกรม</h1>
          <p className="setupPageDesc">กำหนดรายการและเวลาสำหรับ «{title}»</p>
        </div>
        <div className="setupHeaderActions">
          <button className="btnGhost" type="button" onClick={onClearAll} disabled={!items.length}>
            ล้างทั้งหมด
          </button>
          {cloudReady ? (
            <button
              className="btn"
              type="button"
              disabled={!canStart || saving}
              onClick={onSaveToCloud}
            >
              {saving ? 'กำลังบันทึก…' : 'บันทึก Cloud'}
            </button>
          ) : null}
          <button className="btnPrimary" type="button" onClick={onAdd}>
            + เพิ่มรายการ
          </button>
        </div>
      </header>

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
            onClick={onStartControl}
          >
            {saving ? 'กำลังเตรียม…' : 'เริ่มควบคุม'}
          </button>
          {!cloudReady ? (
            <button className="btn" type="button" disabled={!canStart} onClick={onStartLocalDemo}>
              เริ่ม (Local Demo)
            </button>
          ) : null}
          {!cloudReady ? (
            <div className="muted">
              Cloud: สร้าง <code>.env.local</code> จาก <code>.env.example</code> เพื่อบันทึกและ sync
              realtime
            </div>
          ) : null}
        </div>
      </section>

      {lastEventId ? (
        <section className="card">
          <div className="cardHeader">
            <h2 className="cardTitle">ลิงก์แยกจอ</h2>
          </div>
          <EventLinks eventId={lastEventId} />
        </section>
      ) : null}

      <footer className="footer">
        <div className="muted">
          Controller: <code>/start/&lt;eventId&gt;</code> · Stage:{' '}
          <code>/view/&lt;eventId&gt;?kiosk=1</code>
        </div>
      </footer>
    </ControlShell>
  )
}
