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

/** Reuse stable row ids when server refresh rebuilds draft items (match by order). */
export function preserveDraftItemIds(
  previous: DraftItem[],
  incoming: DraftItem[],
): DraftItem[] {
  const idByOrder = new Map(previous.map((it) => [it.order, it.id]))
  return incoming.map((it) => ({
    ...it,
    id: idByOrder.get(it.order) ?? it.id,
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

/** Keep saved setup metadata when refreshing program rows from a possibly stale server event. */
export function eventMetadataForDraftRefresh(params: {
  draft: SetupDraftBundle | null
  lastSavedSnapshot: string | null
  serverEvent: WorshipEvent
}): Pick<SetupDraftBundle, 'title' | 'date' | 'plannedStartTime' | 'settings' | 'leaderNames'> {
  const { draft, lastSavedSnapshot, serverEvent } = params
  if (draft && lastSavedSnapshot && snapshotFromDraftBundle(draft) === lastSavedSnapshot) {
    return {
      title: draft.title,
      date: draft.date,
      plannedStartTime: draft.plannedStartTime,
      settings: draft.settings,
      leaderNames: draft.leaderNames,
    }
  }
  const fromServer = draftBundleFromEventProgram({ event: serverEvent, programItems: [] })
  return {
    title: fromServer.title,
    date: fromServer.date,
    plannedStartTime: fromServer.plannedStartTime,
    settings: fromServer.settings,
    leaderNames: fromServer.leaderNames,
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
  if (lastSavedSnapshot === null) return true
  return snapshotFromDraftBundle(draft) !== lastSavedSnapshot
}

export function shouldRefreshDraftFromServer(isDirty: boolean): boolean {
  return !isDirty
}

export function draftItemsToProgramItems(items: DraftItem[]): ProgramItem[] {
  return items.map((it) => ({
    order: it.order,
    name: it.name,
    leaderName: it.leaderName,
    durationSec: it.durationSec,
    roomLights: it.roomLights ?? '',
    mediaNote: it.mediaNote ?? '',
  }))
}

export function programItemsContentSnapshot(items: ProgramItem[]): string {
  return JSON.stringify(
    [...items]
      .sort((a, b) => a.order - b.order)
      .map(({ order, name, leaderName, durationSec, roomLights, mediaNote }) => ({
        order,
        name,
        leaderName,
        durationSec,
        roomLights: roomLights ?? '',
        mediaNote: mediaNote ?? '',
      })),
  )
}

export function draftProgramContentSnapshot(draft: SetupDraftBundle): string {
  return programItemsContentSnapshot(draftItemsToProgramItems(draft.items))
}

export function shouldRefreshDraftForProgramItems(
  draft: SetupDraftBundle | null,
  programItems: ProgramItem[],
  lastSavedSnapshot: string | null,
  localRevision = 0,
  cloudRevision = 0,
): boolean {
  if (localRevision > cloudRevision) return false
  if (!draft) return true
  const dirty = isSetupDraftDirty(draft, lastSavedSnapshot)
  const contentMismatch =
    programItemsContentSnapshot(programItems) !== draftProgramContentSnapshot(draft)
  if (contentMismatch && !dirty) return true
  return shouldRefreshDraftFromServer(dirty)
}

/** Reject stale cloud snapshots while local revision is ahead of last cloud sync. */
export function shouldApplyServerProgramItems(
  localItems: ProgramItem[],
  serverItems: ProgramItem[],
  localRevision: number,
  cloudRevision: number,
): boolean {
  if (programItemsContentSnapshot(localItems) === programItemsContentSnapshot(serverItems)) {
    return false
  }
  if (localRevision > cloudRevision) {
    return false
  }
  return true
}
