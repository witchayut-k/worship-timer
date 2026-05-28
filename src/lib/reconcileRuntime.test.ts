import { describe, expect, it } from 'vitest'
import type { ProgramItem, RuntimeState } from '../domain/types'
import { indexAfterMove, reconcileRuntimeAfterProgramChange } from './reconcileRuntime'

function item(durationSec: number, order: number): ProgramItem {
  return {
    order,
    name: `Segment ${order}`,
    leaderName: '',
    durationSec,
    roomLights: '',
    mediaNote: '',
  }
}

function state(partial: Partial<RuntimeState> = {}): RuntimeState {
  return {
    currentIndex: 0,
    phase: 'stopped',
    startedAtMs: null,
    remainingSec: 300,
    lastTickAtMs: 1,
    version: 1,
    updatedByUid: null,
    blackout: true,
    manualFlashUntilMs: 123,
    ...partial,
  }
}

describe('indexAfterMove', () => {
  const cases = [
    { current: 0, from: 0, to: 3, expected: 3 },
    { current: 2, from: 0, to: 2, expected: 1 },
    { current: 2, from: 3, to: 1, expected: 3 },
    { current: 2, from: 0, to: 1, expected: 2 },
    { current: 2, from: 4, to: 5, expected: 2 },
    { current: 4, from: 1, to: 4, expected: 3 },
    { current: 1, from: 2, to: 0, expected: 2 },
    { current: 5, from: 2, to: 5, expected: 4 },
  ]

  for (const c of cases) {
    it(`moves current=${c.current} from=${c.from} to=${c.to}`, () => {
      expect(indexAfterMove(c.current, c.from, c.to)).toBe(c.expected)
    })
  }
})

describe('reconcileRuntimeAfterProgramChange', () => {
  it('reset with empty list goes to index 0 stopped 0 sec', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 4, phase: 'running', startedAtMs: 9, remainingSec: 42 }),
      nextItems: [],
      change: { type: 'reset' },
    })
    expect(next.currentIndex).toBe(0)
    expect(next.phase).toBe('stopped')
    expect(next.startedAtMs).toBeNull()
    expect(next.remainingSec).toBe(0)
    expect(next.blackout).toBe(false)
    expect(next.manualFlashUntilMs).toBeNull()
    expect(next.serviceEnded).toBe(false)
  })

  it('reset with items goes to first item duration', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 2, phase: 'paused', remainingSec: 90, serviceEnded: true }),
      nextItems: [item(111, 1), item(222, 2)],
      change: { type: 'reset' },
    })
    expect(next.currentIndex).toBe(0)
    expect(next.remainingSec).toBe(111)
    expect(next.serviceEnded).toBe(false)
  })

  it('import replace behaves like reset', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 1, phase: 'paused', remainingSec: 99 }),
      nextItems: [item(150, 1)],
      change: { type: 'import', mode: 'replace' },
    })
    expect(next.currentIndex).toBe(0)
    expect(next.phase).toBe('stopped')
    expect(next.remainingSec).toBe(150)
  })

  it('delete before current shifts left and keeps phase/timer', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 3, phase: 'running', startedAtMs: 88, remainingSec: 77 }),
      nextItems: [item(100, 1), item(100, 2), item(100, 3), item(100, 4)],
      change: { type: 'delete', removedIndex: 1 },
    })
    expect(next.currentIndex).toBe(2)
    expect(next.phase).toBe('running')
    expect(next.startedAtMs).toBe(88)
    expect(next.remainingSec).toBe(77)
  })

  it('delete after current keeps state untouched', () => {
    const prev = state({ currentIndex: 1, phase: 'running', startedAtMs: 11, remainingSec: 22 })
    const next = reconcileRuntimeAfterProgramChange({
      prev,
      nextItems: [item(120, 1), item(120, 2), item(120, 3)],
      change: { type: 'delete', removedIndex: 2 },
    })
    expect(next).toBe(prev)
  })

  it('delete current switches to stopped and resets duration', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 1, phase: 'paused', remainingSec: 12 }),
      nextItems: [item(100, 1), item(200, 2), item(300, 3)],
      change: { type: 'delete', removedIndex: 1 },
    })
    expect(next.currentIndex).toBe(1)
    expect(next.phase).toBe('stopped')
    expect(next.remainingSec).toBe(200)
    expect(next.blackout).toBe(false)
    expect(next.manualFlashUntilMs).toBeNull()
  })

  it('delete current at end clamps to previous item', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 2, phase: 'paused' }),
      nextItems: [item(90, 1), item(80, 2)],
      change: { type: 'delete', removedIndex: 2 },
    })
    expect(next.currentIndex).toBe(1)
    expect(next.remainingSec).toBe(80)
  })

  it('delete leaving empty list resets runtime', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 0, phase: 'paused', remainingSec: 10 }),
      nextItems: [],
      change: { type: 'delete', removedIndex: 0 },
    })
    expect(next.currentIndex).toBe(0)
    expect(next.phase).toBe('stopped')
    expect(next.remainingSec).toBe(0)
  })

  it('reorder moving current follows moved row', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 1, phase: 'paused', remainingSec: 45 }),
      nextItems: [item(50, 1), item(60, 2), item(70, 3), item(80, 4)],
      change: { type: 'reorder', fromIndex: 1, toIndex: 3 },
    })
    expect(next.currentIndex).toBe(3)
    expect(next.phase).toBe('stopped')
    expect(next.remainingSec).toBe(80)
  })

  it('reorder crossing over current shifts current left', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 2, phase: 'paused', remainingSec: 45 }),
      nextItems: [item(50, 1), item(60, 2), item(70, 3), item(80, 4)],
      change: { type: 'reorder', fromIndex: 0, toIndex: 3 },
    })
    expect(next.currentIndex).toBe(1)
    expect(next.phase).toBe('stopped')
    expect(next.remainingSec).toBe(60)
  })

  it('reorder that does not affect current returns previous state', () => {
    const prev = state({ currentIndex: 2, phase: 'running', startedAtMs: 9, remainingSec: 30 })
    const next = reconcileRuntimeAfterProgramChange({
      prev,
      nextItems: [item(10, 1), item(20, 2), item(30, 3), item(40, 4)],
      change: { type: 'reorder', fromIndex: 0, toIndex: 1 },
    })
    expect(next).toBe(prev)
  })

  it('import append keeps state when index still valid', () => {
    const prev = state({ currentIndex: 1, phase: 'paused', remainingSec: 20 })
    const next = reconcileRuntimeAfterProgramChange({
      prev,
      nextItems: [item(100, 1), item(200, 2), item(300, 3)],
      change: { type: 'import', mode: 'append' },
    })
    expect(next).toBe(prev)
  })

  it('import append clamps oversized index to last item', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 5, phase: 'paused', remainingSec: 20 }),
      nextItems: [item(100, 1), item(200, 2)],
      change: { type: 'import', mode: 'append' },
    })
    expect(next.currentIndex).toBe(1)
    expect(next.phase).toBe('stopped')
    expect(next.remainingSec).toBe(200)
  })

  it('clamp keeps state when already valid', () => {
    const prev = state({ currentIndex: 1, phase: 'running', startedAtMs: 4, remainingSec: 50 })
    const next = reconcileRuntimeAfterProgramChange({
      prev,
      nextItems: [item(100, 1), item(200, 2)],
      change: { type: 'clamp' },
    })
    expect(next).toBe(prev)
  })

  it('clamp fixes out-of-range current and stops timer', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 4, phase: 'running', startedAtMs: 4, remainingSec: 50 }),
      nextItems: [item(100, 1), item(200, 2)],
      change: { type: 'clamp' },
    })
    expect(next.currentIndex).toBe(1)
    expect(next.phase).toBe('stopped')
    expect(next.remainingSec).toBe(200)
  })

  it('delete before current with clamp still keeps index in range', () => {
    const next = reconcileRuntimeAfterProgramChange({
      prev: state({ currentIndex: 2, phase: 'running', startedAtMs: 3, remainingSec: 7 }),
      nextItems: [item(100, 1), item(200, 2)],
      change: { type: 'delete', removedIndex: 0 },
    })
    expect(next.currentIndex).toBe(1)
    expect(next.phase).toBe('running')
    expect(next.remainingSec).toBe(7)
  })
})
