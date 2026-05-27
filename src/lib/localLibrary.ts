import type { ProgramItem, WorshipEvent } from '../domain/types'
import type { LocalPayload } from './localPayload'
import { storageKeys } from './storageKeys'

const STORAGE_KEY = storageKeys.library

export type LocalLibraryEntry = {
  id: string
  event: WorshipEvent
  items: ProgramItem[]
  updatedAtMs: number
}

function readRaw(): LocalLibraryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalLibraryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeRaw(entries: LocalLibraryEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

export function newLocalLibraryId(): string {
  return `lib-${Math.random().toString(36).slice(2, 10)}`
}

export function isLibraryEventId(eventId: string): boolean {
  return eventId.startsWith('lib-')
}

export function listLocalEvents(): LocalLibraryEntry[] {
  return readRaw().sort((a, b) => {
    const dateCmp = b.event.date.localeCompare(a.event.date)
    if (dateCmp !== 0) return dateCmp
    return b.updatedAtMs - a.updatedAtMs
  })
}

export function getLocalEvent(id: string): LocalLibraryEntry | null {
  return readRaw().find((e) => e.id === id) ?? null
}

export function upsertLocalEvent(params: {
  id?: string
  event: WorshipEvent
  items: ProgramItem[]
}): string {
  const id = params.id ?? newLocalLibraryId()
  const updatedAtMs = Date.now()
  const entry: LocalLibraryEntry = {
    id,
    event: { ...params.event, updatedAtMs },
    items: params.items,
    updatedAtMs,
  }
  const all = readRaw()
  const idx = all.findIndex((e) => e.id === id)
  if (idx >= 0) all[idx] = entry
  else all.push(entry)
  writeRaw(all)
  return id
}

export function removeLocalEvent(id: string): void {
  writeRaw(readRaw().filter((e) => e.id !== id))
}

export function resolveLibraryPayload(eventId: string): LocalPayload | null {
  if (!isLibraryEventId(eventId)) return null
  const entry = getLocalEvent(eventId)
  if (!entry) return null
  return { event: entry.event, items: entry.items }
}
