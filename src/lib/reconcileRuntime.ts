import type { ProgramItem, RuntimeState } from '../domain/types'

export type ProgramChange =
  | { type: 'reset' }
  | { type: 'delete'; removedIndex: number }
  | { type: 'reorder'; fromIndex: number; toIndex: number }
  | { type: 'import'; mode: 'replace' | 'append' }
  | { type: 'clamp' }

const CLEAR_STAGE_OUTPUT = {
  blackout: false,
  manualFlashUntilMs: null as number | null,
  serviceEnded: false,
}

function durationAt(items: ProgramItem[], index: number): number {
  return items[index]?.durationSec ?? 0
}

function reconcileAsReset(prev: RuntimeState, nextItems: ProgramItem[]): RuntimeState {
  return {
    ...prev,
    ...CLEAR_STAGE_OUTPUT,
    currentIndex: 0,
    phase: 'stopped',
    startedAtMs: null,
    remainingSec: durationAt(nextItems, 0),
  }
}

function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0
  if (index < 0) return 0
  if (index >= length) return length - 1
  return index
}

export function indexAfterMove(current: number, from: number, to: number): number {
  if (current === from) return to
  if (from < current && to >= current) return current - 1
  if (from > current && to <= current) return current + 1
  return current
}

export function reconcileRuntimeAfterProgramChange(params: {
  prev: RuntimeState
  nextItems: ProgramItem[]
  change: ProgramChange
}): RuntimeState {
  const { prev, nextItems, change } = params
  const nextLen = nextItems.length

  if (change.type === 'reset' || (change.type === 'import' && change.mode === 'replace')) {
    return reconcileAsReset(prev, nextItems)
  }

  if (nextLen === 0) {
    return reconcileAsReset(prev, [])
  }

  if (change.type === 'delete') {
    const removedIndex = change.removedIndex

    if (removedIndex === prev.currentIndex) {
      const nextIndex = clampIndex(prev.currentIndex, nextLen)
      return {
        ...prev,
        ...CLEAR_STAGE_OUTPUT,
        currentIndex: nextIndex,
        phase: 'stopped',
        startedAtMs: null,
        remainingSec: durationAt(nextItems, nextIndex),
      }
    }

    if (removedIndex < prev.currentIndex) {
      const shifted = prev.currentIndex - 1
      const nextIndex = clampIndex(shifted, nextLen)
      return {
        ...prev,
        currentIndex: nextIndex,
      }
    }

    const nextIndex = clampIndex(prev.currentIndex, nextLen)
    if (nextIndex !== prev.currentIndex) {
      return {
        ...prev,
        ...CLEAR_STAGE_OUTPUT,
        currentIndex: nextIndex,
        phase: 'stopped',
        startedAtMs: null,
        remainingSec: durationAt(nextItems, nextIndex),
      }
    }
    return prev
  }

  if (change.type === 'reorder') {
    const candidate = indexAfterMove(prev.currentIndex, change.fromIndex, change.toIndex)
    const nextIndex = clampIndex(candidate, nextLen)
    if (nextIndex !== prev.currentIndex) {
      return {
        ...prev,
        ...CLEAR_STAGE_OUTPUT,
        currentIndex: nextIndex,
        phase: 'stopped',
        startedAtMs: null,
        remainingSec: durationAt(nextItems, nextIndex),
      }
    }
    return prev
  }

  if (change.type === 'import' && change.mode === 'append') {
    const nextIndex = clampIndex(prev.currentIndex, nextLen)
    if (nextIndex === prev.currentIndex) return prev
    return {
      ...prev,
      ...CLEAR_STAGE_OUTPUT,
      currentIndex: nextIndex,
      phase: 'stopped',
      startedAtMs: null,
      remainingSec: durationAt(nextItems, nextIndex),
    }
  }

  if (change.type === 'clamp') {
    const nextIndex = clampIndex(prev.currentIndex, nextLen)
    if (nextIndex === prev.currentIndex) return prev
    return {
      ...prev,
      ...CLEAR_STAGE_OUTPUT,
      currentIndex: nextIndex,
      phase: 'stopped',
      startedAtMs: null,
      remainingSec: durationAt(nextItems, nextIndex),
    }
  }

  return prev
}
