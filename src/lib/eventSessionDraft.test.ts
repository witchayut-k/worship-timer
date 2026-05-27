import { describe, expect, it } from 'vitest'
import type { ProgramItem } from '../domain/types'
import {
  draftBundleFromEventProgram,
  isSetupDraftDirty,
  programToDraftItems,
  shouldRefreshDraftFromServer,
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
})
