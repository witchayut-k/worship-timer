import { Outlet, useMatch } from 'react-router-dom'
import { Component } from 'react'
import type { ReactNode } from 'react'
import { EventSessionLoadingGate } from '../components/EventSessionLoadingGate'
import { EventSessionProvider } from '../context/EventSessionProvider'
import { EventWorkspaceRuntimeProvider } from '../context/EventWorkspaceRuntimeContext'

class WorkspaceErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(_error: Error) {}
  componentDidCatch() {}

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export function EventWorkspaceLayout() {
  const setupMatch = useMatch('/setup/:eventId')
  const startMatch = useMatch('/start/:eventId')
  const eventId = setupMatch?.params.eventId ?? startMatch?.params.eventId

  if (!eventId) {
    return <Outlet />
  }

  return (
    <WorkspaceErrorBoundary>
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
