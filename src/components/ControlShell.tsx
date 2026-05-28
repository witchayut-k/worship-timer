import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useOptionalEventWorkspaceRuntime } from '../context/EventWorkspaceRuntimeContext'
import { usePlan } from '../context/PlanProvider'
import { useResizableAside } from '../hooks/useResizableAside'
import { useRuntimePhase } from '../hooks/useRuntimePhase'
import { useWorkspaceSessionTitle } from '../hooks/useWorkspaceSessionTitle'
import { AppHeaderClock } from './AppHeaderClock'
import { LanguageToggle } from './LanguageToggle'
import { SessionStatusBadge } from './SessionStatusBadge'
import { getOutputLink } from '../lib/outputLinks'
import { BookIcon, ListIcon, MonitorIcon, SlidersIcon } from './SetupIcons'
import { useLocale } from '../i18n/useLocale'

export type ControlNav = 'setup' | 'control' | 'services' | 'stage'

export type SessionStatusProps = {
  eventId: string | null
  productionMode: boolean
  eventTitle?: string
}

type ControlShellProps = {
  activeNav: ControlNav
  eventId?: string | null
  eventTitle?: string
  productionMode?: boolean
  sessionStatus?: SessionStatusProps
  onLeaveToLibrary?: () => void
  onControlNavigate?: () => void | Promise<void>
  controlNavigateDisabled?: boolean
  onStageNavigate?: () => void | Promise<void>
  stageNavigateDisabled?: boolean
  centerSessionStatusBadge?: boolean
  sessionBarCenterContent?: ReactNode
  sessionBarRightContent?: ReactNode
  headerEnd?: ReactNode
  aside?: ReactNode
  children: ReactNode
}

function NavTab({
  active,
  disabled,
  title,
  children,
}: {
  active: boolean
  disabled?: boolean
  title?: string
  children: ReactNode
}) {
  if (disabled) {
    return (
      <span className="appTopNavItem appTopNavItemDisabled" title={title}>
        {children}
      </span>
    )
  }
  return (
    <span className={`appTopNavItem${active ? ' appTopNavItemActive' : ''}`}>{children}</span>
  )
}

export function ControlShell({
  activeNav,
  eventId,
  eventTitle,
  productionMode = false,
  sessionStatus,
  onLeaveToLibrary,
  onControlNavigate,
  controlNavigateDisabled = false,
  onStageNavigate,
  stageNavigateDisabled = false,
  centerSessionStatusBadge = false,
  sessionBarCenterContent,
  sessionBarRightContent,
  headerEnd,
  aside,
  children,
}: ControlShellProps) {
  const { t } = useLocale()
  const resizable = useResizableAside()
  const { isPaid, isFree, homePath } = usePlan()

  const statusEventId = sessionStatus?.eventId ?? null
  const statusProduction = sessionStatus?.productionMode ?? productionMode
  const explicitSessionTitle = sessionStatus?.eventTitle ?? eventTitle
  const statusTitle = useWorkspaceSessionTitle(explicitSessionTitle, t('event.untitled'))

  const workspaceRuntime = useOptionalEventWorkspaceRuntime()
  const fallbackRuntime = useRuntimePhase(workspaceRuntime ? null : statusEventId)
  const { phase, ready } = workspaceRuntime ?? fallbackRuntime
  const showSessionBar = Boolean(statusEventId || eventId || eventTitle)
  const defaultSessionBadge = statusEventId ? (
    <SessionStatusBadge
      productionMode={statusProduction}
      phase={phase}
      ready={ready}
    />
  ) : null
  const sessionBarCenter =
    centerSessionStatusBadge ? null : (sessionBarCenterContent ?? null)
  const sessionBarRight = (
    <>
      {sessionBarRightContent}
      {defaultSessionBadge}
    </>
  )

  const setupTo = eventId ? `/setup/${eventId}` : isFree ? homePath : '/setup'
  const controlTo = eventId ? `/start/${eventId}` : null
  const stageTo = eventId ? getOutputLink(eventId, 'stage').path : null

  const libraryNav = isPaid ? (
    productionMode ? (
      <button
        className="appTopNavItem appTopNavItemButton"
        type="button"
        onClick={onLeaveToLibrary}
      >
        <BookIcon />
        <span>{t('nav.library')}</span>
      </button>
    ) : (
      <Link
        className={`appTopNavItem appTopNavItemLink${activeNav === 'services' ? ' appTopNavItemActive' : ''}`}
        to="/services"
      >
        <BookIcon />
        <span>{t('nav.library')}</span>
      </Link>
    )
  ) : null

  const setupNav = (
    <Link
      className={`appTopNavItem appTopNavItemLink${activeNav === 'setup' ? ' appTopNavItemActive' : ''}`}
      to={setupTo}
    >
      <ListIcon />
      <span>{t('nav.programSetup')}</span>
    </Link>
  )

  const controlNav = controlTo ? (
    onControlNavigate ? (
      <button
        className={`appTopNavItem appTopNavItemLink appTopNavItemButton${activeNav === 'control' ? ' appTopNavItemActive' : ''}`}
        type="button"
        disabled={controlNavigateDisabled}
        onClick={() => {
          void onControlNavigate()
        }}
      >
        <SlidersIcon />
        <span>{t('nav.controlRoom')}</span>
      </button>
    ) : (
      <Link
        className={`appTopNavItem appTopNavItemLink${activeNav === 'control' ? ' appTopNavItemActive' : ''}`}
        to={controlTo}
      >
        <SlidersIcon />
        <span>{t('nav.controlRoom')}</span>
      </Link>
    )
  ) : (
    <NavTab active={false} disabled title={t('nav.controlRoomDisabled')}>
      <SlidersIcon />
      <span>{t('nav.controlRoom')}</span>
    </NavTab>
  )

  const stageNav = stageTo ? (
    onStageNavigate ? (
      <button
        className={`appTopNavItem appTopNavItemLink appTopNavItemButton${activeNav === 'stage' ? ' appTopNavItemActive' : ''}`}
        type="button"
        disabled={stageNavigateDisabled}
        onClick={() => {
          void onStageNavigate()
        }}
      >
        <MonitorIcon />
        <span>{t('nav.stageDisplay')}</span>
      </button>
    ) : (
      <Link
        className={`appTopNavItem appTopNavItemLink${activeNav === 'stage' ? ' appTopNavItemActive' : ''}`}
        to={stageTo}
      >
        <MonitorIcon />
        <span>{t('nav.stageDisplay')}</span>
      </Link>
    )
  ) : (
    <NavTab active={false} disabled title={t('nav.stageDisabled')}>
      <MonitorIcon />
      <span>{t('nav.stageDisplay')}</span>
    </NavTab>
  )

  return (
    <div className="appShell">
      <header className="appHeader">
        <div className="appHeaderStart">
          <Link className="appBrand" to={homePath}>
            {t('app.name')}
          </Link>
          {isPaid ? <span className="planBadge planBadgePro">{t('plan.proBadge')}</span> : null}
          <span className="appHeaderDivider" aria-hidden />
          <AppHeaderClock />
        </div>

        <nav className="appTopNav" aria-label={t('nav.mainMenu')}>
          {isPaid && !productionMode ? libraryNav : null}
          {isPaid && productionMode ? (
            <>
              {controlNav}
              {setupNav}
              {stageNav}
              <span className="appTopNavDivider" role="separator" />
              {libraryNav}
            </>
          ) : (
            <>
              {setupNav}
              {controlNav}
              {stageNav}
            </>
          )}
        </nav>

        <div className="appHeaderEnd">
          {headerEnd}
          {isFree ? (
            <a className="btnGhost btnSm planUpgradeBtn" href="#upgrade">
              {t('plan.upgradeCta')}
            </a>
          ) : null}
          <LanguageToggle />
        </div>
      </header>

      {showSessionBar ? (
        <div className="appSessionBar" role="region" aria-label={t('nav.sessionBar')}>
          <div className="appSessionBarMain">
            <span className="appSessionBarIcon" aria-hidden>
              ◉
            </span>
            <div className="appSessionBarText">
              <div className="appSessionBarTitle">{statusTitle}</div>
            </div>
          </div>
          <div className="appSessionBarCenter">{sessionBarCenter}</div>
          <div className="appSessionBarRight">{sessionBarRight}</div>
        </div>
      ) : null}

      <div className="appMain">
        {aside ? (
          <div
            ref={resizable.gridRef}
            className={`setupMainGrid${resizable.isResizing ? ' setupMainGridResizing' : ''}`}
            style={resizable.gridStyle}
          >
            <div className="setupMainColumn">{children}</div>
            <div
              className="setupSplitGutter"
              role="separator"
              aria-orientation="vertical"
              aria-valuenow={resizable.asideWidth}
              aria-valuemin={resizable.minAsideWidth}
              aria-valuemax={resizable.maxAsideWidth}
              aria-label={t('setup.resizeAside')}
              {...resizable.gutterProps}
            />
            <aside className="setupAside">{aside}</aside>
          </div>
        ) : (
          <div className="controlContent">{children}</div>
        )}
      </div>
    </div>
  )
}
