import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgramItem, WorshipEvent } from '../domain/types'
import { storageKeys } from './storageKeys'
import {
  clearWorkspaceDraft,
  nextWorkspaceRevision,
  readWorkspaceDraft,
  writeWorkspaceDraft,
} from './workspaceDraftStore'

const EVENT_ID = 'test-event-1'

function createStorageMock(): Storage {
  const map = new Map<string, string>()
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.get(key) ?? null
    },
    key(index: number) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, value)
    },
  }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createStorageMock())
})

function baseEvent(): WorshipEvent {
  return {
    title: 'Sunday',
    date: '2026-06-02',
    status: 'active',
    updatedAtMs: 1,
    leaderNames: [],
  }
}

function item(order: number): ProgramItem {
  return {
    order,
    name: `Segment ${order}`,
    leaderName: '',
    durationSec: 300,
    roomLights: '',
    mediaNote: '',
  }
}

afterEach(() => {
  clearWorkspaceDraft(EVENT_ID)
})

describe('workspaceDraftStore', () => {
  it('reads and writes draft records', () => {
    writeWorkspaceDraft(EVENT_ID, { event: baseEvent(), items: [item(1)] })
    const draft = readWorkspaceDraft(EVENT_ID)
    expect(draft?.items).toHaveLength(1)
    expect(draft?.revision).toBe(1)
  })

  it('increments revision on each write without explicit revision', () => {
    writeWorkspaceDraft(EVENT_ID, { event: baseEvent(), items: [] })
    writeWorkspaceDraft(EVENT_ID, { event: baseEvent(), items: [item(1)] })
    const draft = readWorkspaceDraft(EVENT_ID)
    expect(draft?.revision).toBe(2)
  })

  it('nextWorkspaceRevision is monotonic', () => {
    expect(nextWorkspaceRevision(EVENT_ID)).toBe(1)
    expect(nextWorkspaceRevision(EVENT_ID)).toBe(2)
  })

  it('returns null for corrupt JSON', () => {
    localStorage.setItem(storageKeys.workspace(EVENT_ID), '{not json')
    expect(readWorkspaceDraft(EVENT_ID)).toBeNull()
  })

  it('clearWorkspaceDraft removes stored data', () => {
    writeWorkspaceDraft(EVENT_ID, { event: baseEvent(), items: [item(1)] })
    clearWorkspaceDraft(EVENT_ID)
    expect(readWorkspaceDraft(EVENT_ID)).toBeNull()
  })
})
