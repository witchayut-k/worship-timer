import { createContext, useContext, type ReactNode } from 'react'
import type { RuntimePhase } from '../domain/types'
import { useRuntimePhase } from '../hooks/useRuntimePhase'

export type EventWorkspaceRuntimeValue = {
  phase: RuntimePhase | null
  ready: boolean
}

const EventWorkspaceRuntimeContext = createContext<EventWorkspaceRuntimeValue | null>(null)

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

export function useOptionalEventWorkspaceRuntime(): EventWorkspaceRuntimeValue | null {
  return useContext(EventWorkspaceRuntimeContext)
}
