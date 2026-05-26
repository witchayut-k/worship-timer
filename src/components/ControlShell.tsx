import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export type ControlNav = 'setup' | 'control' | 'services'

type ControlShellProps = {
  activeNav: ControlNav
  eventId?: string | null
  eventTitle?: string
  productionMode?: boolean
  onLeaveToServices?: () => void
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
  productionMode = false,
  onLeaveToServices,
  aside,
  children,
}: ControlShellProps) {
  const statusTitle = eventTitle?.trim() || 'ยังไม่ได้เริ่มงาน'
  const statusSub = productionMode
    ? 'กำลังควบคุม'
    : eventId
      ? 'กำลังผลิตรายการ'
      : 'ตั้งค่าโปรแกรมก่อนเริ่ม'

  const controlLink = eventId ? (
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
  )

  const setupLink = (
    <Link
      className={`sidebarNavItem ${activeNav === 'setup' ? 'sidebarNavItemActive' : ''}`}
      to={eventId ? `/setup/${eventId}` : '/setup'}
    >
      ตั้งค่าโปรแกรม
    </Link>
  )

  const stageButton = eventId ? (
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
  )

  const servicesLink = productionMode ? (
    <button
      className="sidebarNavItem sidebarNavItemButton sidebarNavItemMuted"
      type="button"
      onClick={onLeaveToServices}
    >
      ไปรายการนมัสการ…
    </button>
  ) : (
    <Link
      className={`sidebarNavItem ${activeNav === 'services' ? 'sidebarNavItemActive' : ''}`}
      to="/services"
    >
      รายการนมัสการ
    </Link>
  )

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
          {productionMode ? (
            <>
              {controlLink}
              {setupLink}
              {stageButton}
              <div className="sidebarNavDivider" role="separator" />
              <div className="sidebarNavSectionLabel">ไลบรารี</div>
              {servicesLink}
            </>
          ) : (
            <>
              {servicesLink}
              {controlLink}
              {setupLink}
              {stageButton}
            </>
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
