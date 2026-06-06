import { describe, expect, it } from 'vitest'
import type { ProgramItem } from '../domain/types'
import {
  draftBundleFromEventProgram,
  isSetupDraftDirty,
  preserveDraftItemIds,
  programToDraftItems,
  shouldRefreshDraftForProgramItems,
  shouldRefreshDraftFromServer,
  shouldApplyServerProgramItems,
  snapshotFromDraftBundle,
} from './eventSessionDraft'

function programItem(order: number): ProgramItem {
  return {
    order,
    name: `Segment ${order}`,
    leaderName: 'Leader',
    durationSec: 300,
    roomLights: '',
    mediaNote: '',
  }
}

describe('eventSessionDraft', () => {
  it('preserves draft item ids by order when refreshing from server', () => {
    const previous = programToDraftItems([programItem(1), programItem(2)], () => 'stable-a')
    previous[1] = { ...previous[1]!, id: 'stable-b' }
    const incoming = programToDraftItems(
      [
        { ...programItem(1), name: 'Updated 1' },
        { ...programItem(2), name: 'Updated 2' },
      ],
      () => 'new-id',
    )
    const merged = preserveDraftItemIds(previous, incoming)
    expect(merged[0]?.id).toBe('stable-a')
    expect(merged[1]?.id).toBe('stable-b')
    expect(merged[0]?.name).toBe('Updated 1')
    expect(merged[1]?.name).toBe('Updated 2')
  })

  it('builds draft items from program with stable ids when newId is fixed', () => {
    let n = 0
    const items = programToDraftItems([programItem(1)], () => `id-${++n}`)
    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe('id-1')
    expect(items[0]?.order).toBe(1)
  })

  it('treats null baseline as dirty (unknown save state)', () => {
    const draft = draftBundleFromEventProgram({
      event: {
        title: 'Sunday',
        date: '2026-05-28',
        status: 'active',
        updatedAtMs: 1,
        leaderNames: [],
      },
      programItems: [programItem(1)],
      newId: () => 'a',
    })
    expect(isSetupDraftDirty(draft, null)).toBe(true)
  })

  it('detects dirty draft when snapshot differs', () => {
    const draft = draftBundleFromEventProgram({
      event: {
        title: 'Sunday',
        date: '2026-05-28',
        status: 'active',
        updatedAtMs: 1,
        leaderNames: [],
      },
      programItems: [programItem(1)],
      newId: () => 'a',
    })
    const saved = snapshotFromDraftBundle(draft)
    expect(isSetupDraftDirty(draft, saved)).toBe(false)

    const edited = { ...draft, title: 'Changed' }
    expect(isSetupDraftDirty(edited, saved)).toBe(true)
  })

  it('does not refresh draft from server when dirty', () => {
    expect(shouldRefreshDraftFromServer(true)).toBe(false)
    expect(shouldRefreshDraftFromServer(false)).toBe(true)
  })

  it('refreshes draft when program content mismatches but draft is not dirty', () => {
    const draft = draftBundleFromEventProgram({
      event: {
        title: 'Sunday',
        date: '2026-05-28',
        status: 'active',
        updatedAtMs: 1,
        leaderNames: [],
      },
      programItems: [],
      newId: () => 'a',
    })
    const saved = snapshotFromDraftBundle(draft)
    expect(
      shouldRefreshDraftForProgramItems(draft, [programItem(1)], saved),
    ).toBe(true)
  })

  it('rejects stale server program with fewer items when local is ahead', () => {
    const local = [programItem(1), programItem(2), programItem(3)]
    const server = [programItem(1)]
    expect(shouldApplyServerProgramItems(local, server, 5, 2)).toBe(false)
  })

  it('rejects stale server program after reset when local is empty but ahead', () => {
    const server = [programItem(1), programItem(2), programItem(3)]
    expect(shouldApplyServerProgramItems([], server, 5, 2)).toBe(false)
  })

  it('accepts server program when cloud revision caught up', () => {
    const local = [programItem(1)]
    const server = [programItem(1), programItem(2)]
    expect(shouldApplyServerProgramItems(local, server, 2, 2)).toBe(true)
  })

  it('treats matching empty program as no apply (hydrate elsewhere)', () => {
    expect(shouldApplyServerProgramItems([], [], 0, 0)).toBe(false)
  })

  it('does not refresh draft from server while local revision is ahead', () => {
    const draft = draftBundleFromEventProgram({
      event: {
        title: 'Sunday',
        date: '2026-05-28',
        status: 'active',
        updatedAtMs: 1,
        leaderNames: [],
      },
      programItems: [],
      newId: () => 'a',
    })
    const saved = snapshotFromDraftBundle(draft)
    expect(
      shouldRefreshDraftForProgramItems(draft, [programItem(1)], saved, 5, 2),
    ).toBe(false)
  })

  it('rejects stale server program after import replace when local is ahead', () => {
    const local = Array.from({ length: 5 }, (_, i) => programItem(i + 1))
    const server = Array.from({ length: 10 }, (_, i) => programItem(i + 1))
    expect(shouldApplyServerProgramItems(local, server, 11, 10)).toBe(false)
  })

  it('does not refresh draft after import replace while local revision is ahead', () => {
    const draft = draftBundleFromEventProgram({
      event: {
        title: 'Sunday',
        date: '2026-05-28',
        status: 'active',
        updatedAtMs: 1,
        leaderNames: [],
      },
      programItems: Array.from({ length: 5 }, (_, i) => programItem(i + 1)),
      newId: () => 'a',
    })
    const saved = snapshotFromDraftBundle(draft)
    const staleServer = Array.from({ length: 10 }, (_, i) => programItem(i + 1))
    expect(
      shouldRefreshDraftForProgramItems(draft, staleServer, saved, 11, 10),
    ).toBe(false)
  })
})
