import { describe, expect, it, vi } from 'vitest'
import { isEventWorkspaceBootLoading } from './eventSessionLoading'

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
