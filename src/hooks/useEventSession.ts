import { useContext } from 'react'
import {
  EventSessionContext,
  type EventSessionContextValue,
} from '../context/eventSessionContext'

export function useEventSession(): EventSessionContextValue {
  const ctx = useContext(EventSessionContext)
  if (!ctx) {
    throw new Error('useEventSession must be used within EventSessionProvider')
  }
  return ctx
}

export function useOptionalEventSession(): EventSessionContextValue | null {
  return useContext(EventSessionContext)
}
