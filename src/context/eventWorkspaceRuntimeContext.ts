import { createContext } from 'react'
import type { RuntimePhase } from '../domain/types'

export type EventWorkspaceRuntimeValue = {
  phase: RuntimePhase | null
  ready: boolean
}

export const EventWorkspaceRuntimeContext =
  createContext<EventWorkspaceRuntimeValue | null>(null)
