import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useOptionalEventWorkspaceRuntime } from '../hooks/useOptionalEventWorkspaceRuntime'
import { usePlan } from '../hooks/usePlan'
import { useResizableAside } from '../hooks/useResizableAside'
import { useRuntimePhase } from '../hooks/useRuntimePhase'
import { useWorkspaceSessionTitle } from '../hooks/useWorkspaceSessionTitle'
import { AppHeaderClock } from './AppHeaderClock'
import { LanguageToggle } from './LanguageToggle'
import { WorkspaceSyncStatusBar } from './WorkspaceSyncStatusBar'
import { ScheduleViewSettingsButton } from './ScheduleViewSettingsButton'
import type { ScheduleViewSettingsVariant } from './ScheduleViewSettingsModal'
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
  timelineAvailable?: boolean
  aside?: ReactNode
  children: ReactNode
}

function settingsVariantForNav(activeNav: ControlNav): ScheduleViewSettingsVariant {
  if (activeNav === 'control') return 'control'
  if (activeNav === 'setup') return 'setup'
  return 'default'
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
  timelineAvailable = false,
  aside,
  children,
}: ControlShellProps) {
  const { t } = useLocale()
  const {
    gridRef,
    asideWidth,
    minAsideWidth,
    maxAsideWidth,
    isResizing,
    gridStyle,
    gutterProps,
  } = useResizableAside()
  const { isPaid, isFree, homePath, showUpgradeCta } = usePlan()

  const statusEventId = sessionStatus?.eventId ?? null
  const statusProduction = sessionStatus?.productionMode ?? productionMode
  const explicitSessionTitle = sessionStatus?.eventTitle ?? eventTitle
  const statusTitle = useWorkspaceSessionTitle(explicitSessionTitle, t('event.untitled'))

  const workspaceRuntime = useOptionalEventWorkspaceRuntime()
  const fallbackRuntime = useRuntimePhase(workspaceRuntime ? null : statusEventId)
  const { phase, ready, serviceEnded } = workspaceRuntime ?? fallbackRuntime
  const showSessionBar = Boolean(statusEventId || eventId || eventTitle)
  const defaultSessionBadge = statusEventId ? (
    <SessionStatusBadge
      productionMode={statusProduction}
      phase={phase}
      ready={ready}
      serviceEnded={serviceEnded}
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
          <Link className="appBrand" to={homePath} aria-label={t('app.name')}>
            <img className="appBrandLogo" src="/logo.png" alt="" width={458} height={70} />
          </Link>
          {isPaid ? <span className="planBadge planBadgePro">{t('plan.proBadge')}</span> : null}
          <span className="appHeaderDivider" aria-hidden />
          <AppHeaderClock />
          {isPaid && !productionMode ? libraryNav : null}
        </div>

        <nav className="appTopNav" aria-label={t('nav.mainMenu')}>
          {isPaid && productionMode ? (
            <>
              {controlNav}
              {setupNav}
              {stageNav}
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
          {isPaid && productionMode ? libraryNav : null}
          {headerEnd}
          <ScheduleViewSettingsButton
            variant={settingsVariantForNav(activeNav)}
            timelineAvailable={timelineAvailable}
          />
          {showUpgradeCta ? (
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
            ref={gridRef}
            className={`setupMainGrid${isResizing ? ' setupMainGridResizing' : ''}`}
            style={gridStyle}
          >
            <div className="setupMainColumn">{children}</div>
            <div
              className="setupSplitGutter"
              role="separator"
              aria-orientation="vertical"
              aria-valuenow={asideWidth}
              aria-valuemin={minAsideWidth}
              aria-valuemax={maxAsideWidth}
              aria-label={t('setup.resizeAside')}
              {...gutterProps}
            />
            <aside className="setupAside">{aside}</aside>
          </div>
        ) : (
          <div className="controlContent">{children}</div>
        )}
      </div>
      <WorkspaceSyncStatusBar />
    </div>
  )
}
