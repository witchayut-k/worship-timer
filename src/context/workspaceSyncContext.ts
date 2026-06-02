import { createContext } from 'react'
import type { ProgramItem, RuntimeState, WorshipEvent } from '../domain/types'
import type { WorkspaceSyncSnapshot, WorkspaceSyncStatus } from '../lib/workspaceCloudSync'

export type PersistDraftParams = {
  event: WorshipEvent
  items: ProgramItem[]
  touchRuntime?: boolean
  initialState?: RuntimeState
}

export type WorkspaceSyncContextValue = {
  eventId: string
  cloudEnabled: boolean
  snapshot: WorkspaceSyncSnapshot
  status: WorkspaceSyncStatus
  persistDraft: (params: PersistDraftParams) => void
  flushCloud: () => Promise<WorkspaceSyncSnapshot>
  retrySync: () => void
}

export const WorkspaceSyncContext = createContext<WorkspaceSyncContextValue | null>(null)
