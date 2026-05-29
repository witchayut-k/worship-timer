import { useMemo } from 'react'
import { buildPlannedSegmentSchedule, type PlannedSegmentSchedule } from '../domain/schedule'
import type { ProgramItem } from '../domain/types'

export function usePlannedSegmentSchedule(
  items: ProgramItem[],
  eventDate: string | undefined,
  plannedStartTime: string | undefined,
): PlannedSegmentSchedule {
  return useMemo(
    () => buildPlannedSegmentSchedule(items, eventDate, plannedStartTime),
    [items, eventDate, plannedStartTime],
  )
}
