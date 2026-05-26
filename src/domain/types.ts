export type EventStatus = 'draft' | 'active' | 'ended'

export type RuntimePhase = 'stopped' | 'running' | 'paused'

export type Role = 'controller' | 'viewer'

export type EventDisplaySettings = {
  overtimeFlash: boolean
  warningAtOneMinute: boolean
}

export const DEFAULT_EVENT_DISPLAY_SETTINGS: EventDisplaySettings = {
  overtimeFlash: true,
  warningAtOneMinute: true,
}

export type WorshipEvent = {
  title: string
  date: string // YYYY-MM-DD
  status: EventStatus
  updatedAtMs: number
  ownerUid?: string
  settings?: EventDisplaySettings
  leaderNames?: string[]
}

export type ProgramItem = {
  order: number
  name: string
  leaderName: string
  durationSec: number
}

export type RuntimeState = {
  currentIndex: number
  phase: RuntimePhase
  startedAtMs: number | null
  remainingSec: number
  lastTickAtMs: number
  version: number
  updatedByUid: string | null
}

export type EventDoc = {
  id: string
  data: WorshipEvent
}

export type ProgramItemDoc = {
  id: string
  data: ProgramItem
}

export function resolveEventSettings(
  event?: Pick<WorshipEvent, 'settings'> | null,
): EventDisplaySettings {
  return {
    ...DEFAULT_EVENT_DISPLAY_SETTINGS,
    ...event?.settings,
  }
}
