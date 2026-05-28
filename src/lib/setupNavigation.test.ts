import { describe, expect, it, vi } from 'vitest'
import type { EventSessionContextValue } from '../context/eventSessionContext'
import { needsSetupPersistBeforeNav } from './setupNavigation'

function mockSession(isDirty: boolean, programItems = [{ order: 1, name: 'A', leaderName: '', durationSec: 300, roomLights: '', mediaNote: '' }]): EventSessionContextValue {
  return {
    eventId: 'evt-1',
    status: 'ready',
    event: null,
    programItems,
    programItemsHydrated: true,
    setupDraft: null,
    error: null,
    hasSetupDraft: () => true,
    ensureSetupDraft: vi.fn(),
    replaceSetupDraft: vi.fn(),
    markSetupDraftSaved: vi.fn(),
    isSetupDraftDirty: () => isDirty,
    notifyProgramPersisted: vi.fn(),
  }
}

describe('needsSetupPersistBeforeNav', () => {
  it('returns false when idle and draft is clean', () => {
    expect(needsSetupPersistBeforeNav(mockSession(false), 'idle')).toBe(false)
    expect(needsSetupPersistBeforeNav(mockSession(false), 'saved')).toBe(false)
  })

  it('returns true when draft is dirty', () => {
    expect(needsSetupPersistBeforeNav(mockSession(true), 'idle')).toBe(true)
    expect(needsSetupPersistBeforeNav(mockSession(true), 'saved')).toBe(true)
  })

  it('returns true while save is in flight or failed', () => {
    expect(needsSetupPersistBeforeNav(mockSession(false), 'pending')).toBe(true)
    expect(needsSetupPersistBeforeNav(mockSession(false), 'saving')).toBe(true)
    expect(needsSetupPersistBeforeNav(mockSession(false), 'error')).toBe(true)
  })

  it('returns false when session is missing and save is idle', () => {
    expect(needsSetupPersistBeforeNav(null, 'idle')).toBe(false)
  })

  it('returns true when local draft differs from persisted program items', () => {
    const session = mockSession(false)
    expect(
      needsSetupPersistBeforeNav(session, 'saved', [
        {
          id: 'x',
          order: 1,
          name: 'New',
          leaderName: '',
          durationSec: 300,
          roomLights: '',
          mediaNote: '',
        },
      ]),
    ).toBe(true)
  })
})
