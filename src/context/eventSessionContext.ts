import { createContext } from 'react'
import type { ProgramItem, WorshipEvent } from '../domain/types'
import type { SetupDraftBundle } from '../lib/eventSessionDraft'

export type EventSessionStatus = 'loading' | 'ready' | 'error'

export type EventSessionContextValue = {
  eventId: string
  status: EventSessionStatus
  event: WorshipEvent | null
  programItems: ProgramItem[]
  error: string | null
  hasSetupDraft: () => boolean
  ensureSetupDraft: () => SetupDraftBundle
  replaceSetupDraft: (draft: SetupDraftBundle) => void
  markSetupDraftSaved: (snapshot: string) => void
  isSetupDraftDirty: () => boolean
  notifyProgramPersisted: (event: WorshipEvent, items: ProgramItem[]) => void
}

export const EventSessionContext = createContext<EventSessionContextValue | null>(null)
