import { Outlet, useMatch } from 'react-router-dom'
import { EventSessionProvider } from '../context/EventSessionProvider'
import { EventWorkspaceRuntimeProvider } from '../context/EventWorkspaceRuntimeContext'

export function EventWorkspaceLayout() {
  const setupMatch = useMatch('/setup/:eventId')
  const startMatch = useMatch('/start/:eventId')
  const eventId = setupMatch?.params.eventId ?? startMatch?.params.eventId

  if (!eventId) {
    return <Outlet />
  }

  return (
    <EventSessionProvider eventId={eventId}>
      <EventWorkspaceRuntimeProvider eventId={eventId}>
        <Outlet />
      </EventWorkspaceRuntimeProvider>
    </EventSessionProvider>
  )
}
