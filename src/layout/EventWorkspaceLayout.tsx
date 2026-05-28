import { Outlet, useMatch } from 'react-router-dom'
import { Component } from 'react'
import type { ReactNode } from 'react'
import { EventSessionLoadingGate } from '../components/EventSessionLoadingGate'
import { EventSessionProvider } from '../context/EventSessionProvider'
import { EventWorkspaceRuntimeProvider } from '../context/EventWorkspaceRuntimeContext'
import { useLocale } from '../i18n/useLocale'

class WorkspaceErrorBoundary extends Component<
  {
    children: ReactNode
    title: string
    message: string
    reloadLabel: string
  },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(_error: Error, _info: unknown) {}

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'grid',
            placeItems: 'center',
            padding: '24px',
          }}
        >
          <div style={{ maxWidth: '480px', textAlign: 'center' }}>
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{this.props.title}</h1>
            <p style={{ marginTop: '10px', marginBottom: '16px', opacity: 0.85 }}>
              {this.props.message}
            </p>
            <button type="button" className="btnSecondary" onClick={() => window.location.reload()}>
              {this.props.reloadLabel}
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function EventWorkspaceLayout() {
  const { t } = useLocale()
  const setupMatch = useMatch('/setup/:eventId')
  const startMatch = useMatch('/start/:eventId')
  const eventId = setupMatch?.params.eventId ?? startMatch?.params.eventId

  if (!eventId) {
    return <Outlet />
  }

  return (
    <WorkspaceErrorBoundary
      title={t('setup.workspaceCrashTitle')}
      message={t('setup.workspaceCrashBody')}
      reloadLabel={t('setup.workspaceCrashReload')}
    >
      <EventSessionProvider eventId={eventId}>
        <EventSessionLoadingGate>
          <EventWorkspaceRuntimeProvider eventId={eventId}>
            <Outlet />
          </EventWorkspaceRuntimeProvider>
        </EventSessionLoadingGate>
      </EventSessionProvider>
    </WorkspaceErrorBoundary>
  )
}
