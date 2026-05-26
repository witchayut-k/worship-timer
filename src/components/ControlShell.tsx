import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { LanguageToggle } from './LanguageToggle'
import { useLocale } from '../i18n/useLocale'

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
  const { t } = useLocale()
  const statusTitle = eventTitle?.trim() || t('event.untitled')
  const statusSub = productionMode
    ? t('nav.controlling')
    : eventId
      ? t('nav.inProduction')
      : t('nav.setupBeforeStart')

  const controlLink = eventId ? (
    <Link
      className={`sidebarNavItem ${activeNav === 'control' ? 'sidebarNavItemActive' : ''}`}
      to={`/start/${eventId}`}
    >
      {t('nav.controlRoom')}
    </Link>
  ) : (
    <span
      className="sidebarNavItem sidebarNavItemDisabled"
      title={t('nav.controlRoomDisabled')}
    >
      {t('nav.controlRoom')}
    </span>
  )

  const setupLink = (
    <Link
      className={`sidebarNavItem ${activeNav === 'setup' ? 'sidebarNavItemActive' : ''}`}
      to={eventId ? `/setup/${eventId}` : '/setup'}
    >
      {t('nav.programSetup')}
    </Link>
  )

  const stageButton = eventId ? (
    <button
      className="sidebarNavItem sidebarNavItemButton"
      type="button"
      onClick={() => openStage(eventId)}
    >
      {t('nav.stageDisplay')}
    </button>
  ) : (
    <span
      className="sidebarNavItem sidebarNavItemDisabled"
      title={t('nav.stageDisabled')}
    >
      {t('nav.stageDisplay')}
    </span>
  )

  const servicesLink = productionMode ? (
    <button
      className="sidebarNavItem sidebarNavItemButton sidebarNavItemMuted"
      type="button"
      onClick={onLeaveToServices}
    >
      {t('nav.goToServices')}
    </button>
  ) : (
    <Link
      className={`sidebarNavItem ${activeNav === 'services' ? 'sidebarNavItemActive' : ''}`}
      to="/services"
    >
      {t('nav.services')}
    </Link>
  )

  return (
    <div className="controlShell">
      <aside className="sidebar">
        <div className="sidebarBrand">Worship Timer</div>
        <LanguageToggle />

        <div className="sidebarStatus">
          <div className="sidebarStatusIcon" aria-hidden>
            ◉
          </div>
          <div>
            <div className="sidebarStatusTitle">{statusTitle}</div>
            <div className="sidebarStatusSub">{statusSub}</div>
          </div>
        </div>

        <nav className="sidebarNav" aria-label={t('nav.mainMenu')}>
          {productionMode ? (
            <>
              {controlLink}
              {setupLink}
              {stageButton}
              <div className="sidebarNavDivider" role="separator" />
              <div className="sidebarNavSectionLabel">{t('nav.library')}</div>
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
