export type EventStatus = 'draft' | 'active' | 'ended'

export type RuntimePhase = 'stopped' | 'running' | 'paused'

export type Role = 'controller' | 'viewer'

export type StageDisplayTemplate = 'circle' | 'minimal' | 'bar'

const STAGE_DISPLAY_TEMPLATES: StageDisplayTemplate[] = ['circle', 'minimal', 'bar']

export function parseStageDisplayTemplate(value: unknown): StageDisplayTemplate {
  if (typeof value === 'string' && STAGE_DISPLAY_TEMPLATES.includes(value as StageDisplayTemplate)) {
    return value as StageDisplayTemplate
  }
  return 'circle'
}

export type EventDisplaySettings = {
  overtimeFlash: boolean
  warningAtOneMinute: boolean
  stageTemplate?: StageDisplayTemplate
}

export const DEFAULT_EVENT_DISPLAY_SETTINGS: EventDisplaySettings = {
  overtimeFlash: true,
  warningAtOneMinute: true,
  stageTemplate: 'circle',
}

export type WorshipEvent = {
  title: string
  date: string // YYYY-MM-DD
  /** Local time "HH:mm" for planned service start (optional). */
  plannedStartTime?: string
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
  roomLights?: string
  mediaNote?: string
}

export type RuntimeState = {
  currentIndex: number
  phase: RuntimePhase
  startedAtMs: number | null
  remainingSec: number
  lastTickAtMs: number
  version: number
  updatedByUid: string | null
  blackout: boolean
  manualFlashUntilMs: number | null
  /** When true, service is ended for crew/stage outputs (synced). */
  serviceEnded?: boolean
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
  const merged = {
    ...DEFAULT_EVENT_DISPLAY_SETTINGS,
    ...event?.settings,
  }
  return {
    ...merged,
    stageTemplate: parseStageDisplayTemplate(merged.stageTemplate),
  }
}
