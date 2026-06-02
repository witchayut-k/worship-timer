import type { ProgramItem, WorshipEvent } from '../domain/types'
import { storageKeys } from './storageKeys'

export type WorkspaceDraftRecord = {
  event: WorshipEvent
  items: ProgramItem[]
  updatedAtMs: number
  revision: number
}

function storageKey(eventId: string): string {
  return storageKeys.workspace(eventId)
}

function readRevisionCounter(eventId: string): number {
  try {
    const raw = localStorage.getItem(`${storageKey(eventId)}:rev`)
    if (!raw) return 0
    const n = Number(raw)
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

function writeRevisionCounter(eventId: string, revision: number): void {
  try {
    localStorage.setItem(`${storageKey(eventId)}:rev`, String(revision))
  } catch {
    // ignore quota / private mode
  }
}

export function nextWorkspaceRevision(eventId: string): number {
  const next = readRevisionCounter(eventId) + 1
  writeRevisionCounter(eventId, next)
  return next
}

export function readWorkspaceDraft(eventId: string): WorkspaceDraftRecord | null {
  try {
    const raw = localStorage.getItem(storageKey(eventId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as WorkspaceDraftRecord
    if (!parsed || typeof parsed !== 'object') return null
    if (!Array.isArray(parsed.items)) return null
    if (typeof parsed.revision !== 'number' || !Number.isFinite(parsed.revision)) return null
    if (typeof parsed.updatedAtMs !== 'number' || !Number.isFinite(parsed.updatedAtMs)) return null
    if (!parsed.event || typeof parsed.event !== 'object') return null
    return parsed
  } catch {
    return null
  }
}

export function writeWorkspaceDraft(
  eventId: string,
  params: {
    event: WorshipEvent
    items: ProgramItem[]
    revision?: number
  },
): WorkspaceDraftRecord {
  const revision = params.revision ?? nextWorkspaceRevision(eventId)
  const record: WorkspaceDraftRecord = {
    event: params.event,
    items: params.items,
    updatedAtMs: Date.now(),
    revision,
  }
  try {
    localStorage.setItem(storageKey(eventId), JSON.stringify(record))
    writeRevisionCounter(eventId, revision)
  } catch {
    // ignore quota / private mode
  }
  return record
}

export function clearWorkspaceDraft(eventId: string): void {
  try {
    localStorage.removeItem(storageKey(eventId))
    localStorage.removeItem(`${storageKey(eventId)}:rev`)
  } catch {
    // ignore
  }
}
