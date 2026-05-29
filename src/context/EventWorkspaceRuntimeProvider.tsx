import { type ReactNode } from 'react'
import { useRuntimePhase } from '../hooks/useRuntimePhase'
import { EventWorkspaceRuntimeContext } from './eventWorkspaceRuntimeContext'

export function EventWorkspaceRuntimeProvider({
  eventId,
  children,
}: {
  eventId: string
  children: ReactNode
}) {
  const runtime = useRuntimePhase(eventId)
  return (
    <EventWorkspaceRuntimeContext.Provider value={runtime}>
      {children}
    </EventWorkspaceRuntimeContext.Provider>
  )
}
