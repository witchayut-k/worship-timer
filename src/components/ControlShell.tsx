import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type ControlNav = 'setup' | 'control'

type ControlShellProps = {
  activeNav: ControlNav
  eventId?: string | null
  eventTitle?: string
  aside?: ReactNode
  children: ReactNode
}

function openStage(eventId: string) {
  window.open(`/view/${eventId}?kiosk=1`, '_blank', 'noopener,noreferrer')
}

export function ControlShell({
  activeNav,
  eventId,
  eventTitle,
  aside,
  children,
}: ControlShellProps) {
  const statusTitle = eventTitle?.trim() || 'ยังไม่ได้เริ่มงาน'
  const statusSub = eventId ? 'กำลังผลิตรายการ' : 'ตั้งค่าโปรแกรมก่อนเริ่ม'

  return (
    <div className="controlShell">
      <aside className="sidebar">
        <div className="sidebarBrand">Worship Timer</div>

        <div className="sidebarStatus">
          <div className="sidebarStatusIcon" aria-hidden>
            ◉
          </div>
          <div>
            <div className="sidebarStatusTitle">{statusTitle}</div>
            <div className="sidebarStatusSub">{statusSub}</div>
          </div>
        </div>

        <nav className="sidebarNav" aria-label="เมนูหลัก">
          {eventId ? (
            <Link
              className={`sidebarNavItem ${activeNav === 'control' ? 'sidebarNavItemActive' : ''}`}
              to={`/start/${eventId}`}
            >
              ห้องควบคุม
            </Link>
          ) : (
            <span
              className="sidebarNavItem sidebarNavItemDisabled"
              title="บันทึกหรือเริ่มงานก่อนเพื่อเข้าห้องควบคุม"
            >
              ห้องควบคุม
            </span>
          )}

          <Link
            className={`sidebarNavItem ${activeNav === 'setup' ? 'sidebarNavItemActive' : ''}`}
            to="/setup"
          >
            ตั้งค่าโปรแกรม
          </Link>

          {eventId ? (
            <button
              className="sidebarNavItem sidebarNavItemButton"
              type="button"
              onClick={() => openStage(eventId)}
            >
              จอ Stage
            </button>
          ) : (
            <span
              className="sidebarNavItem sidebarNavItemDisabled"
              title="บันทึกหรือเริ่มงานก่อนเพื่อเปิดจอ Stage"
            >
              จอ Stage
            </span>
          )}
        </nav>
      </aside>

      <div className="controlMain">
        {aside ? (
          <div className="setupMainGrid">
            <div className="setupMainColumn">{children}</div>
            <aside className="setupAside">{aside}</aside>
          </div>
        ) : (
          <div className="controlContent">{children}</div>
        )}
      </div>
    </div>
  )
}
