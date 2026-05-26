import { createContext } from 'react'

export type ActiveControl = {
  eventId: string
  title: string
}

export type ActiveControlContextValue = {
  activeControl: ActiveControl | null
  setActiveControl: (eventId: string, title: string) => void
  clearActiveControl: () => void
  endActiveControl: () => Promise<void>
  isProductionForEvent: (eventId: string | null | undefined) => boolean
}

export const ActiveControlContext = createContext<ActiveControlContextValue | null>(null)
