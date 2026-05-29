import type { ScheduleViewPrefs } from '../hooks/useScheduleViewPrefs'

export type ResolvedScheduleViewLayout = {
  useTimelineWrapper: boolean
  useTimelinePickLayout: boolean
  showPlannedTimes: boolean
  showRowTimes: boolean
  showDurationFallback: boolean
}

export function resolveScheduleViewLayout(
  scheduleEnabled: boolean,
  prefs: Pick<ScheduleViewPrefs, 'showPlannedTimes' | 'showTimelineRail' | 'showRowTimes'>,
): ResolvedScheduleViewLayout {
  const useTimelineWrapper = scheduleEnabled && prefs.showTimelineRail
  const useTimelinePickLayout = scheduleEnabled && prefs.showTimelineRail
  const showPlannedTimes = scheduleEnabled && prefs.showPlannedTimes
  const showRowTimes = prefs.showRowTimes
  const showDurationFallback =
    showRowTimes && (!scheduleEnabled || !useTimelinePickLayout)

  return {
    useTimelineWrapper,
    useTimelinePickLayout,
    showPlannedTimes,
    showRowTimes,
    showDurationFallback,
  }
}
