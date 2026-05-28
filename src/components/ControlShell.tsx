import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useOptionalEventWorkspaceRuntime } from '../context/EventWorkspaceRuntimeContext'
import { usePlan } from '../context/PlanProvider'
import { useResizableAside } from '../hooks/useResizableAside'
import { useRuntimePhase } from '../hooks/useRuntimePhase'
import { useWorkspaceSessionTitle } from '../hooks/useWorkspaceSessionTitle'
import { AppHeaderClock } from './AppHeaderClock'
import { LanguageToggle } from './LanguageToggle'
import { SessionStatusBadge } from './SessionStatusBadge'
import { BookIcon, ListIcon, SlidersIcon } from './SetupIcons'
import { useLocale } from '../i18n/useLocale'

export type ControlNav = 'setup' | 'control' | 'services'

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
  headerEnd,
  aside,
  children,
}: ControlShellProps) {
  const { t } = useLocale()
  const location = useLocation()
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

  const setupTo = eventId ? `/setup/${eventId}` : isFree ? homePath : '/setup'
  const controlTo = eventId ? `/start/${eventId}` : null

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
          // #region agent log
          fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-1',hypothesisId:'H1',location:'ControlShell.tsx:controlButtonClick',message:'control button click handler fired',data:{pathname:location.pathname,controlTo,controlNavigateDisabled,hasHandler:Boolean(onControlNavigate)},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
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
        onClick={(e) => {
          // #region agent log
          fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-3',hypothesisId:'H9',location:'ControlShell.tsx:controlLinkClick:event',message:'control link click event payload',data:{pathname:location.pathname,controlTo,defaultPrevented:e.defaultPrevented,button:e.button,metaKey:e.metaKey,ctrlKey:e.ctrlKey,shiftKey:e.shiftKey,altKey:e.altKey},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
        }}
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
              <span className="appTopNavDivider" role="separator" />
              {libraryNav}
            </>
          ) : (
            <>
              {setupNav}
              {controlNav}
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
          {statusEventId ? (
            <SessionStatusBadge
              productionMode={statusProduction}
              phase={phase}
              ready={ready}
            />
          ) : null}
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
