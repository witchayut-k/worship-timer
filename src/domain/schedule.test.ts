import { describe, expect, it } from 'vitest'
import type { ProgramItem } from './types'
import {
  buildPlannedSegmentSchedule,
  computeProgramPlannedEndMs,
  computeSegmentPlannedEndMs,
  computeSegmentPlannedStartMs,
  parsePlannedStartMs,
} from './schedule'

function item(durationSec: number, order = 1): ProgramItem {
  return {
    order,
    name: 'Segment',
    leaderName: '',
    durationSec,
    roomLights: '',
    mediaNote: '',
  }
}

describe('schedule planned end times', () => {
  const date = '2026-05-29'
  const time = '10:00'
  const nowMs = Date.parse('2026-05-29T08:00:00')

  it('parses planned start for local calendar day', () => {
    const ms = parsePlannedStartMs(date, time, nowMs)
    expect(ms).not.toBeNull()
    const d = new Date(ms!)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(4)
    expect(d.getDate()).toBe(29)
    expect(d.getHours()).toBe(10)
    expect(d.getMinutes()).toBe(0)
  })

  it('computes segment end from cumulative durations', () => {
    const plannedStartMs = parsePlannedStartMs(date, time, nowMs)!
    const items = [item(600, 1), item(300, 2), item(900, 3)]

    const start1 = computeSegmentPlannedStartMs(plannedStartMs, items, 1)
    const end1 = computeSegmentPlannedEndMs(plannedStartMs, items, 1)
    expect(start1).toBe(plannedStartMs + 600_000)
    expect(end1).toBe(plannedStartMs + 900_000)

    const programEnd = computeProgramPlannedEndMs(plannedStartMs, items)
    expect(programEnd).toBe(plannedStartMs + 1_800_000)
  })

  it('buildPlannedSegmentSchedule is disabled without start time', () => {
    const schedule = buildPlannedSegmentSchedule([item(300)], date, '', nowMs)
    expect(schedule.enabled).toBe(false)
  })

  it('buildPlannedSegmentSchedule returns labeled rows when enabled', () => {
    const items = [item(600, 1), item(300, 2)]
    const schedule = buildPlannedSegmentSchedule(items, date, time, nowMs)
    expect(schedule.enabled).toBe(true)
    if (!schedule.enabled) return

    expect(schedule.rows).toHaveLength(2)
    expect(schedule.rows[0]?.startLabel).toBe('10:00')
    expect(schedule.rows[0]?.endLabel).toBe('10:10')
    expect(schedule.rows[1]?.startLabel).toBe('10:10')
    expect(schedule.rows[1]?.endLabel).toBe('10:15')
    expect(schedule.programEndLabel).toBe('10:15')
  })
})
