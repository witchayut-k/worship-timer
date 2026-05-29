import { useCallback, useState } from 'react'

export const SCHEDULE_VIEW_PREFS_STORAGE_KEY = 'worship-timer:schedule-view-prefs'

export type ScheduleViewPrefs = {
  showPlannedTimes: boolean
  showTimelineRail: boolean
  showRowTimes: boolean
  showCrewNotes: boolean
  scrollActiveIntoView: boolean
}

export const DEFAULT_SCHEDULE_VIEW_PREFS: ScheduleViewPrefs = {
  showPlannedTimes: true,
  showTimelineRail: true,
  showRowTimes: true,
  showCrewNotes: true,
  scrollActiveIntoView: true,
}

function parseBool(value: unknown, fallback: boolean): boolean {
  if (value === true || value === '1' || value === 'true') return true
  if (value === false || value === '0' || value === 'false') return false
  return fallback
}

function readStoredPrefs(): ScheduleViewPrefs {
  try {
    const raw = localStorage.getItem(SCHEDULE_VIEW_PREFS_STORAGE_KEY)
    if (!raw) return DEFAULT_SCHEDULE_VIEW_PREFS
    const parsed = JSON.parse(raw) as Partial<ScheduleViewPrefs>
    return {
      showPlannedTimes: parseBool(parsed.showPlannedTimes, DEFAULT_SCHEDULE_VIEW_PREFS.showPlannedTimes),
      showTimelineRail: parseBool(parsed.showTimelineRail, DEFAULT_SCHEDULE_VIEW_PREFS.showTimelineRail),
      showRowTimes: parseBool(parsed.showRowTimes, DEFAULT_SCHEDULE_VIEW_PREFS.showRowTimes),
      showCrewNotes: parseBool(parsed.showCrewNotes, DEFAULT_SCHEDULE_VIEW_PREFS.showCrewNotes),
      scrollActiveIntoView: parseBool(
        parsed.scrollActiveIntoView,
        DEFAULT_SCHEDULE_VIEW_PREFS.scrollActiveIntoView,
      ),
    }
  } catch {
    return DEFAULT_SCHEDULE_VIEW_PREFS
  }
}

function persistPrefs(prefs: ScheduleViewPrefs) {
  try {
    localStorage.setItem(SCHEDULE_VIEW_PREFS_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // ignore
  }
}

export function useScheduleViewPrefs() {
  const [prefs, setPrefsState] = useState(readStoredPrefs)

  const setPatch = useCallback((patch: Partial<ScheduleViewPrefs>) => {
    setPrefsState((prev) => {
      const next = { ...prev, ...patch }
      persistPrefs(next)
      return next
    })
  }, [])

  return { prefs, setPatch }
}
