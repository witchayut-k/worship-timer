import type { AppLocale } from '../i18n/types'
import { toIntlLocale } from '../i18n/translate'
import type { ProgramItem } from './types'

export function parsePlannedStartMs(date: string, time: string, nowMs: number): number | null {
  const trimmedDate = date.trim()
  const trimmedTime = time.trim()
  if (!trimmedDate || !trimmedTime) return null

  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmedDate)
  const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(trimmedTime)
  if (!dateMatch || !timeMatch) return null

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour > 23 ||
    minute > 59
  ) {
    return null
  }

  const parsed = new Date(year, month - 1, day, hour, minute, 0, 0)
  if (Number.isNaN(parsed.getTime())) return null

  // If the planned start is far in the past relative to "now", assume next occurrence is same calendar day only.
  void nowMs
  return parsed.getTime()
}

export function formatWallClock(ms: number): string {
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${hh}:${mm}:${ss}`
}

export function formatWallClockShort(ms: number): string {
  const d = new Date(ms)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

export function computeCueFinishMs(nowMs: number, remainingSec: number): number {
  return nowMs + remainingSec * 1000
}

export function sumDurationSec(items: ProgramItem[], fromIndex = 0): number {
  return items.slice(fromIndex).reduce((sum, it) => sum + Math.max(0, it.durationSec), 0)
}

export function computeServiceOverUnderSec(params: {
  plannedStartMs: number
  items: ProgramItem[]
  currentIndex: number
  remainingSec: number
  nowMs: number
}): number {
  const { plannedStartMs, items, currentIndex, remainingSec, nowMs } = params
  const totalPlannedSec = sumDurationSec(items)
  const plannedEndMs = plannedStartMs + totalPlannedSec * 1000
  const futureSec = sumDurationSec(items, currentIndex + 1)
  const projectedEndMs = nowMs + (remainingSec + futureSec) * 1000
  return Math.trunc((projectedEndMs - plannedEndMs) / 1000)
}

export function computeSegmentPlannedStartMs(
  plannedStartMs: number,
  items: ProgramItem[],
  index: number,
): number | null {
  if (index < 0 || index >= items.length) return null
  let offsetSec = 0
  for (let i = 0; i < index; i += 1) {
    offsetSec += Math.max(0, items[i]?.durationSec ?? 0)
  }
  return plannedStartMs + offsetSec * 1000
}

export function getTimezoneLabel(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local'
  } catch {
    return 'Local'
  }
}

export function formatLocalDateShort(nowMs: number, locale: AppLocale = 'en'): string {
  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(nowMs)
}
