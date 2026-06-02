import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProgramItem, WorshipEvent } from '../domain/types'
import {
  enqueueWorkspaceSync,
  flushWorkspaceSync,
  getWorkspaceSyncSnapshot,
  noteLocalRevision,
  resetWorkspaceSyncForTests,
  subscribeWorkspaceSync,
} from './workspaceCloudSync'

vi.mock('./firestoreRepo', () => ({
  upsertEventProgram: vi.fn().mockResolvedValue(undefined),
  upsertEventWithItems: vi.fn().mockResolvedValue(undefined),
}))

import { upsertEventProgram } from './firestoreRepo'

const EVENT_ID = 'sync-test-1'

function baseEvent(): WorshipEvent {
  return {
    title: 'Test',
    date: '2026-06-02',
    status: 'active',
    updatedAtMs: 1,
    leaderNames: [],
  }
}

function item(order: number): ProgramItem {
  return {
    order,
    name: `Seg ${order}`,
    leaderName: '',
    durationSec: 60,
  }
}

function payload(revision: number, count: number) {
  return {
    event: baseEvent(),
    items: Array.from({ length: count }, (_, i) => item(i + 1)),
    revision,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(upsertEventProgram).mockClear()
})

afterEach(() => {
  resetWorkspaceSyncForTests(EVENT_ID)
  vi.useRealTimers()
})

describe('workspaceCloudSync', () => {
  it('tracks localOnly when cloud disabled', () => {
    noteLocalRevision(EVENT_ID, 1, false)
    expect(getWorkspaceSyncSnapshot(EVENT_ID).status).toBe('localOnly')
  })

  it('debounces and coalesces enqueues into one write', async () => {
    enqueueWorkspaceSync(EVENT_ID, payload(1, 1), {}, true)
    enqueueWorkspaceSync(EVENT_ID, payload(2, 2), {}, true)
    enqueueWorkspaceSync(EVENT_ID, payload(3, 3), {}, true)

    expect(getWorkspaceSyncSnapshot(EVENT_ID).status).toBe('pending')

    await vi.advanceTimersByTimeAsync(1000)
    await flushWorkspaceSync(EVENT_ID)

    expect(upsertEventProgram).toHaveBeenCalledTimes(1)
    expect(upsertEventProgram).toHaveBeenCalledWith(
      expect.objectContaining({
        eventId: EVENT_ID,
        items: expect.arrayContaining([expect.objectContaining({ order: 3 })]),
      }),
    )
    expect(getWorkspaceSyncSnapshot(EVENT_ID).status).toBe('synced')
    expect(getWorkspaceSyncSnapshot(EVENT_ID).cloudRevision).toBe(3)
  })

  it('sets error status when sync fails and retries on next enqueue', async () => {
    vi.mocked(upsertEventProgram).mockRejectedValueOnce(new Error('network'))

    enqueueWorkspaceSync(EVENT_ID, payload(1, 1), {}, true)
    await vi.advanceTimersByTimeAsync(1000)
    await flushWorkspaceSync(EVENT_ID)

    expect(getWorkspaceSyncSnapshot(EVENT_ID).status).toBe('error')
    expect(getWorkspaceSyncSnapshot(EVENT_ID).lastError).toBe('network')

    vi.mocked(upsertEventProgram).mockResolvedValueOnce(undefined)
    enqueueWorkspaceSync(EVENT_ID, payload(2, 2), {}, true)
    await vi.advanceTimersByTimeAsync(1000)
    await flushWorkspaceSync(EVENT_ID)

    expect(getWorkspaceSyncSnapshot(EVENT_ID).status).toBe('synced')
    expect(getWorkspaceSyncSnapshot(EVENT_ID).cloudRevision).toBe(2)
  })

  it('notifies subscribers on status change', async () => {
    const seen: string[] = []
    subscribeWorkspaceSync(EVENT_ID, (snap) => {
      seen.push(snap.status)
    })

    noteLocalRevision(EVENT_ID, 1, true)
    enqueueWorkspaceSync(EVENT_ID, payload(1, 1), {}, true)
    await vi.advanceTimersByTimeAsync(1000)
    await flushWorkspaceSync(EVENT_ID)

    expect(seen).toContain('pending')
    expect(seen).toContain('synced')
  })
})
