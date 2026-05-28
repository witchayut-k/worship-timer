import { describe, expect, it } from 'vitest'
import type { ProgramItem } from '../domain/types'
import { initialRuntimeState, reduceRuntimeState } from './runtimeEngine'

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
