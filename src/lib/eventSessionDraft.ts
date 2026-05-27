import type { DraftItem } from '../components/SetupSegmentList'
import {
  DEFAULT_EVENT_DISPLAY_SETTINGS,
  type EventDisplaySettings,
  type ProgramItem,
  type WorshipEvent,
} from '../domain/types'
import { serializeSetupSnapshot } from '../hooks/useSetupAutoSave'

export type SetupDraftBundle = {
  title: string
  date: string
  plannedStartTime: string
  settings: EventDisplaySettings
  leaderNames: string[]
  items: DraftItem[]
}

export function newDraftItemId(): string {
  return Math.random().toString(36).slice(2, 10)
}

export function programToDraftItems(
  items: ProgramItem[],
  newId: () => string = newDraftItemId,
): DraftItem[] {
  return items.map((it) => ({
    id: newId(),
    order: it.order,
    name: it.name,
    leaderName: it.leaderName,
    durationSec: it.durationSec,
    roomLights: it.roomLights ?? '',
    mediaNote: it.mediaNote ?? '',
  }))
}

export function draftBundleFromEventProgram(params: {
  event: WorshipEvent
  programItems: ProgramItem[]
  newId?: () => string
}): SetupDraftBundle {
  const { event, programItems, newId } = params
  return {
    title: event.title,
    date: event.date,
    plannedStartTime: event.plannedStartTime ?? '',
    settings: { ...DEFAULT_EVENT_DISPLAY_SETTINGS, ...event.settings },
    leaderNames: event.leaderNames ?? [],
    items: programToDraftItems(programItems, newId),
  }
}

export function snapshotFromDraftBundle(draft: SetupDraftBundle): string {
  return serializeSetupSnapshot({
    title: draft.title,
    date: draft.date,
    plannedStartTime: draft.plannedStartTime,
    settings: draft.settings,
    leaderNames: draft.leaderNames,
    items: draft.items,
  })
}

export function isSetupDraftDirty(
  draft: SetupDraftBundle,
  lastSavedSnapshot: string | null,
): boolean {
  if (lastSavedSnapshot === null) return false
  return snapshotFromDraftBundle(draft) !== lastSavedSnapshot
}

export function shouldRefreshDraftFromServer(isDirty: boolean): boolean {
  return !isDirty
}
