import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ControlShell } from '../components/ControlShell'
import { SwitchControlModal } from '../components/LeaveControlModal'
import {
  filterServiceEntries,
  groupServicesByDate,
  type ServiceListEntry,
} from '../domain/serviceList'
import type { EventStatus } from '../domain/types'
import { useActiveControl } from '../hooks/useActiveControl'
import { useAuth } from '../hooks/useAuth'
import { hasFirebaseConfig } from '../lib/firebase'
import { listEventsForUser } from '../lib/firestoreRepo'
import { listLocalEvents } from '../lib/localLibrary'

const STATUS_LABEL: Record<EventStatus, string> = {
  draft: 'ร่าง',
  active: 'พร้อม',
  ended: 'จบแล้ว',
}

function StatusBadge({ status }: { status: EventStatus }) {
  return <span className={`serviceStatusBadge serviceStatusBadge--${status}`}>{STATUS_LABEL[status]}</span>
}

type PendingSwitch = {
  eventId: string
  title: string
}

export function ServicesPage() {
  const nav = useNavigate()
  const { activeControl, setActiveControl } = useActiveControl()
  const { user, uid, ready, canUseAuth, signIn, signOut } = useAuth()
  const [entries, setEntries] = useState<ServiceListEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendingSwitch, setPendingSwitch] = useState<PendingSwitch | null>(null)

  const cloudMode = canUseAuth && Boolean(uid)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (cloudMode && uid) {
        const docs = await listEventsForUser(uid)
        setEntries(docs.map((d) => ({ ...d, itemCount: undefined })))
      } else {
        const local = listLocalEvents()
        setEntries(
          local.map((e) => ({
            id: e.id,
            data: e.event,
            itemCount: e.items.length,
          })),
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'โหลดรายการไม่สำเร็จ')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [cloudMode, uid])

  useEffect(() => {
    if (!ready) return
    void refresh()
  }, [ready, refresh])

  const filtered = useMemo(() => filterServiceEntries(entries, search), [entries, search])
  const groups = useMemo(() => groupServicesByDate(filtered), [filtered])

  const storageHint = cloudMode
    ? 'ซิงก์กับ Cloud แล้ว'
    : canUseAuth
      ? 'เก็บในเครื่อง — เข้าสู่ระบบเพื่อซิงก์ Cloud'
      : 'เก็บในเครื่อง (Local)'

  const openControl = (session: ServiceListEntry) => {
    if (activeControl && activeControl.eventId !== session.id) {
      setPendingSwitch({ eventId: session.id, title: session.data.title })
      return
    }
    nav(`/start/${session.id}`)
  }

  const confirmSwitch = () => {
    if (!pendingSwitch) return
    setActiveControl(pendingSwitch.eventId, pendingSwitch.title)
    setPendingSwitch(null)
    nav(`/start/${pendingSwitch.eventId}`)
  }

  return (
    <ControlShell activeNav="services">
      {activeControl ? (
        <div className="servicesActiveBanner">
          <span>กำลังควบคุม «{activeControl.title}»</span>
          <button
            className="btn btnSm"
            type="button"
            onClick={() => nav(`/start/${activeControl.eventId}`)}
          >
            กลับห้องควบคุม
          </button>
        </div>
      ) : null}

      <header className="servicesPageHeader">
        <div className="servicesPageHeaderText">
          <h1 className="setupPageTitle">รายการนมัสการ</h1>
          <p className="setupPageDesc">ไลบรารีรอบนมัสการ — {storageHint}</p>
        </div>
        <div className="servicesHeaderActions">
          {canUseAuth ? (
            user ? (
              <button className="btnGhost" type="button" onClick={() => void signOut()}>
                ออกจากระบบ
              </button>
            ) : (
              <button className="btn" type="button" onClick={() => void signIn().then(() => refresh())}>
                เข้าสู่ระบบ
              </button>
            )
          ) : null}
          <Link className="btnPrimary" to="/setup">
            + สร้างรอบใหม่
          </Link>
        </div>
      </header>

      <div className="servicesToolbar">
        <label className="servicesSearchField">
          <span className="servicesSearchIcon" aria-hidden>
            ⌕
          </span>
          <input
            className="servicesSearchInput"
            type="search"
            placeholder="ค้นหาชื่องานหรือวันที่…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>

      {error ? <p className="saveNotice saveNoticeError">{error}</p> : null}

      {loading ? (
        <p className="muted servicesLoading">กำลังโหลดรายการ…</p>
      ) : groups.length === 0 ? (
        <div className="servicesEmpty">
          <p className="muted">ยังไม่มีรอบในไลบรารี</p>
          <Link className="btnPrimary" to="/setup">
            สร้างรอบใหม่
          </Link>
        </div>
      ) : (
        <div className="servicesList">
          {groups.map((group) => (
            <section key={group.date} className="servicesDateGroup">
              <header className="servicesDateHeader">
                <h2 className="servicesDateTitle">{group.label}</h2>
                <span className="servicesDateCount">
                  {group.sessions.length} รอบ
                </span>
              </header>
              <ul className="servicesSessionList">
                {group.sessions.map((session) => {
                  const canControl =
                    session.itemCount === undefined || session.itemCount > 0
                  const isActiveSession = activeControl?.eventId === session.id
                  return (
                    <li
                      key={session.id}
                      className={`servicesSessionCard${isActiveSession ? ' servicesSessionCard--active' : ''}`}
                    >
                      <div className="servicesSessionMain">
                        {isActiveSession ? (
                          <span className="serviceLiveBadge">กำลังควบคุม</span>
                        ) : (
                          <StatusBadge status={session.data.status} />
                        )}
                        <div className="servicesSessionTitle">{session.data.title}</div>
                      </div>
                      <div className="servicesSessionActions">
                        <Link className="btn btnSm" to={`/setup/${session.id}`}>
                          แก้ไข
                        </Link>
                        {canControl ? (
                          isActiveSession ? (
                            <button
                              className="btnPrimary btnSm"
                              type="button"
                              onClick={() => nav(`/start/${session.id}`)}
                            >
                              กลับห้องควบคุม
                            </button>
                          ) : (
                            <button
                              className="btnPrimary btnSm"
                              type="button"
                              onClick={() => openControl(session)}
                            >
                              ควบคุม
                            </button>
                          )
                        ) : (
                          <span className="btn btnSm btnDisabled" title="ยังไม่มีรายการโปรแกรม">
                            ควบคุม
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      {!loading && groups.length > 0 ? (
        <footer className="servicesListFooter">
          <p className="muted">ท้ายไลบรารี — สร้างรอบใหม่เพื่อเพิ่มรายการ</p>
          <Link className="btn" to="/setup">
            + สร้างรอบใหม่
          </Link>
        </footer>
      ) : null}

      {!hasFirebaseConfig() ? (
        <p className="muted servicesEnvHint">
          ตั้งค่า Firebase ใน <code>.env.local</code> เพื่อซิงก์ Cloud เมื่อเข้าสู่ระบบ
        </p>
      ) : null}

      <SwitchControlModal
        open={pendingSwitch != null}
        fromTitle={activeControl?.title ?? ''}
        toTitle={pendingSwitch?.title ?? ''}
        onConfirm={confirmSwitch}
        onCancel={() => setPendingSwitch(null)}
      />
    </ControlShell>
  )
}
