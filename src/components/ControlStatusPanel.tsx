import { useMemo } from 'react'
import type { ProgramItem } from '../domain/types'
import {
  computeCueFinishMs,
  computeServiceOverUnderSec,
  formatWallClock,
  parsePlannedStartMs,
} from '../domain/schedule'
import { formatSignedMMSS } from '../domain/time'

type Props = {
  nowMs: number
  eventDate?: string
  plannedStartTime?: string
  items: ProgramItem[]
  currentIndex: number
  remainingSec: number
}

export function ControlStatusPanel({
  nowMs,
  eventDate,
  plannedStartTime,
  items,
  currentIndex,
  remainingSec,
}: Props) {
  const scheduleMeta = useMemo(() => {
    if (!eventDate?.trim() || !plannedStartTime?.trim()) return null
    const plannedStartMs = parsePlannedStartMs(eventDate, plannedStartTime, nowMs)
    if (plannedStartMs == null) return null

    const cueFinishMs = computeCueFinishMs(nowMs, remainingSec)
    const overUnderSec = computeServiceOverUnderSec({
      plannedStartMs,
      items,
      currentIndex,
      remainingSec,
      nowMs,
    })

    return {
      cueFinishText: formatWallClock(cueFinishMs),
      overUnderText: formatSignedMMSS(overUnderSec),
      overUnderLate: overUnderSec > 0,
    }
  }, [eventDate, plannedStartTime, nowMs, remainingSec, items, currentIndex])

  if (!scheduleMeta) return null

  return (
    <section className="controlStatusPanel" aria-label="สถานะเวลา">
      <div className="controlStatusGrid">
        <div className="controlStatusItem">
          <span className="controlStatusLabel">Cue finish</span>
          <span className="controlStatusValue timeMono">{scheduleMeta.cueFinishText}</span>
        </div>
        <div className="controlStatusItem">
          <span className="controlStatusLabel">Over/Under</span>
          <span
            className={`controlStatusValue timeMono ${scheduleMeta.overUnderLate ? 'controlStatusLate' : 'controlStatusEarly'}`}
          >
            {scheduleMeta.overUnderText}
          </span>
        </div>
      </div>
    </section>
  )
}
