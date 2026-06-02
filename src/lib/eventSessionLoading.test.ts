import { describe, expect, it, vi } from 'vitest'
import {
  getWorkspaceLoadingPhase,
  isEventWorkspaceBootLoading,
  workspaceLoadingMessageKey,
} from './eventSessionLoading'

describe('isEventWorkspaceBootLoading', () => {
  it('waits for auth', () => {
    expect(
      isEventWorkspaceBootLoading(false, 'loading', () => false, 'start', false),
    ).toBe(true)
  })

  it('setup waits for draft while loading', () => {
    expect(
      isEventWorkspaceBootLoading(true, 'loading', () => false, 'setup', false),
    ).toBe(true)
    expect(
      isEventWorkspaceBootLoading(true, 'loading', () => true, 'setup', false),
    ).toBe(false)
  })

  it('start waits while session status is loading', () => {
    expect(
      isEventWorkspaceBootLoading(true, 'loading', vi.fn(), 'start', false),
    ).toBe(true)
  })

  it('start stays loading until program items hydrated when ready', () => {
    expect(
      isEventWorkspaceBootLoading(true, 'ready', vi.fn(), 'start', false),
    ).toBe(true)
    expect(
      isEventWorkspaceBootLoading(true, 'ready', vi.fn(), 'start', true),
    ).toBe(false)
  })

  it('setup waits for programItemsHydrated once ready', () => {
    expect(
      isEventWorkspaceBootLoading(true, 'ready', () => true, 'setup', false),
    ).toBe(true)
    expect(
      isEventWorkspaceBootLoading(true, 'ready', () => true, 'setup', true),
    ).toBe(false)
  })

  it('does not load on error', () => {
    expect(
      isEventWorkspaceBootLoading(true, 'error', vi.fn(), 'start', false),
    ).toBe(false)
  })
})

describe('getWorkspaceLoadingPhase', () => {
  it('returns auth when auth not ready', () => {
    expect(getWorkspaceLoadingPhase(false, 'loading', () => false, 'start', false)).toBe(
      'auth',
    )
  })

  it('returns session while loading without setup draft', () => {
    expect(getWorkspaceLoadingPhase(true, 'loading', () => false, 'start', false)).toBe(
      'session',
    )
  })

  it('returns program when ready but items not hydrated', () => {
    expect(getWorkspaceLoadingPhase(true, 'ready', () => true, 'start', false)).toBe(
      'program',
    )
  })

  it('returns null when boot complete', () => {
    expect(getWorkspaceLoadingPhase(true, 'ready', () => true, 'start', true)).toBeNull()
  })
})

describe('workspaceLoadingMessageKey', () => {
  it('maps phases to i18n keys', () => {
    expect(workspaceLoadingMessageKey('auth')).toBe('loading.signingIn')
    expect(workspaceLoadingMessageKey('session')).toBe('loading.loadingEvent')
    expect(workspaceLoadingMessageKey('program')).toBe('loading.loadingProgramItems')
    expect(workspaceLoadingMessageKey(null)).toBe('setup.loadingProgram')
  })
})
