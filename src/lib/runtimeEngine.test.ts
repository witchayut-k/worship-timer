import { describe, expect, it } from 'vitest'
import type { ProgramItem } from '../domain/types'
import { initialRuntimeState, reduceRuntimeState, clampRuntimeIndex } from './runtimeEngine'

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

const items = [item(300, 1), item(180, 2), item(120, 3)]

describe('reduceRuntimeState jumpTo', () => {
  it('stops and resets duration when autoStart is omitted', () => {
    const base = initialRuntimeState({ items })
    const running = reduceRuntimeState(base, { type: 'start', nowMs: 1000 })
    const next = reduceRuntimeState(running, {
      type: 'jumpTo',
      nowMs: 2000,
      index: 1,
      items,
    })

    expect(next.currentIndex).toBe(1)
    expect(next.phase).toBe('stopped')
    expect(next.startedAtMs).toBeNull()
    expect(next.remainingSec).toBe(180)
    expect(next.blackout).toBe(false)
    expect(next.manualFlashUntilMs).toBeNull()
    expect(next.serviceEnded).toBe(false)
  })

  it('starts running with full duration when autoStart is true', () => {
    const base = initialRuntimeState({ items })
    const paused = reduceRuntimeState(
      reduceRuntimeState(base, { type: 'start', nowMs: 1000 }),
      { type: 'pause', nowMs: 1500 },
    )
    const next = reduceRuntimeState(paused, {
      type: 'jumpTo',
      nowMs: 3000,
      index: 2,
      items,
      autoStart: true,
    })

    expect(next.currentIndex).toBe(2)
    expect(next.phase).toBe('running')
    expect(next.startedAtMs).toBe(3000)
    expect(next.remainingSec).toBe(120)
  })

  it('does not auto-start when autoStart is false', () => {
    const base = initialRuntimeState({ items })
    const next = reduceRuntimeState(base, {
      type: 'jumpTo',
      nowMs: 500,
      index: 1,
      items,
      autoStart: false,
    })

    expect(next.phase).toBe('stopped')
    expect(next.startedAtMs).toBeNull()
  })
})

describe('clampRuntimeIndex', () => {
  it('returns unchanged state when index is in range', () => {
    const state = initialRuntimeState({ items })
    state.currentIndex = 1
    expect(clampRuntimeIndex(state, items)).toBe(state)
  })

  it('returns unchanged state when items are empty', () => {
    const state = initialRuntimeState({ items: [] })
    state.currentIndex = 3
    expect(clampRuntimeIndex(state, [])).toBe(state)
  })

  it('clamps out-of-bounds index and stops running phase', () => {
    const state = initialRuntimeState({ items })
    state.currentIndex = 5
    state.phase = 'running'
    state.startedAtMs = 1000
    state.remainingSec = 42

    const next = clampRuntimeIndex(state, items)
    expect(next.currentIndex).toBe(2)
    expect(next.remainingSec).toBe(120)
    expect(next.phase).toBe('stopped')
    expect(next.startedAtMs).toBeNull()
  })

  it('clamps negative index to zero', () => {
    const state = initialRuntimeState({ items })
    state.currentIndex = -1

    const next = clampRuntimeIndex(state, items)
    expect(next.currentIndex).toBe(0)
    expect(next.remainingSec).toBe(300)
  })
})

describe('reduceRuntimeState endService', () => {
  it('pauses running timer and sets blackout + serviceEnded', () => {
    const base = initialRuntimeState({ items })
    const running = reduceRuntimeState(base, { type: 'start', nowMs: 1000 })
    const ended = reduceRuntimeState(running, { type: 'endService', nowMs: 5000 })

    expect(ended.phase).toBe('paused')
    expect(ended.blackout).toBe(true)
    expect(ended.serviceEnded).toBe(true)
    expect(ended.startedAtMs).toBeNull()
    expect(ended.remainingSec).toBeLessThan(300)
  })

  it('sets serviceEnded from stopped without changing phase', () => {
    const base = initialRuntimeState({ items })
    const ended = reduceRuntimeState(base, { type: 'endService', nowMs: 1000 })

    expect(ended.phase).toBe('stopped')
    expect(ended.blackout).toBe(true)
    expect(ended.serviceEnded).toBe(true)
  })

  it('start clears serviceEnded and blackout', () => {
    const base = initialRuntimeState({ items })
    const ended = reduceRuntimeState(base, { type: 'endService', nowMs: 1000 })
    const resumed = reduceRuntimeState(ended, { type: 'start', nowMs: 2000 })

    expect(resumed.phase).toBe('running')
    expect(resumed.blackout).toBe(false)
    expect(resumed.serviceEnded).toBe(false)
  })

  it('resetCurrent clears serviceEnded', () => {
    const base = initialRuntimeState({ items })
    const ended = reduceRuntimeState(base, { type: 'endService', nowMs: 1000 })
    const reset = reduceRuntimeState(ended, {
      type: 'resetCurrent',
      nowMs: 2000,
      items,
    })

    expect(reset.serviceEnded).toBe(false)
    expect(reset.blackout).toBe(false)
  })
})

describe('reduceRuntimeState liveMessage', () => {
  it('sets activeMessage with trimmed text', () => {
    const base = initialRuntimeState({ items })
    const next = reduceRuntimeState(base, {
      type: 'setLiveMessage',
      nowMs: 5000,
      text: '  Stand for worship  ',
    })

    expect(next.activeMessage).toEqual({ text: 'Stand for worship', sentAtMs: 5000 })
  })

  it('rejects empty message', () => {
    const base = initialRuntimeState({ items })
    const next = reduceRuntimeState(base, {
      type: 'setLiveMessage',
      nowMs: 5000,
      text: '   ',
    })

    expect(next).toBe(base)
    expect(next.activeMessage).toBeNull()
  })

  it('clears activeMessage', () => {
    const base = initialRuntimeState({ items })
    const withMsg = reduceRuntimeState(base, {
      type: 'setLiveMessage',
      nowMs: 1000,
      text: 'Hello',
    })
    const cleared = reduceRuntimeState(withMsg, { type: 'clearLiveMessage', nowMs: 2000 })

    expect(cleared.activeMessage).toBeNull()
  })

  it('clearLiveMessage is no-op when already empty', () => {
    const base = initialRuntimeState({ items })
    const next = reduceRuntimeState(base, { type: 'clearLiveMessage', nowMs: 1000 })

    expect(next).toBe(base)
  })

  it('preserves activeMessage on start and jumpTo', () => {
    const base = initialRuntimeState({ items })
    const withMsg = reduceRuntimeState(base, {
      type: 'setLiveMessage',
      nowMs: 1000,
      text: 'Cue',
    })
    const started = reduceRuntimeState(withMsg, { type: 'start', nowMs: 2000 })
    const jumped = reduceRuntimeState(started, {
      type: 'jumpTo',
      nowMs: 3000,
      index: 1,
      items,
    })

    expect(started.activeMessage).toEqual({ text: 'Cue', sentAtMs: 1000 })
    expect(jumped.activeMessage).toEqual({ text: 'Cue', sentAtMs: 1000 })
  })
})
