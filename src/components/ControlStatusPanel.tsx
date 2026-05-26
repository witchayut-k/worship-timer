import { useMemo } from 'react'
import type { ProgramItem } from '../domain/types'
import {
  computeCueFinishMs,
  computeServiceOverUnderSec,
  formatLocalDateShort,
  formatWallClock,
  getTimezoneLabel,
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
  const timezone = getTimezoneLabel()
  const dateLabel = formatLocalDateShort(nowMs)
  const clockText = formatWallClock(nowMs)

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

  return (
    <section className="controlStatusPanel" aria-label="สถานะเวลา">
      <div className="controlWallClock" aria-live="off">
        {clockText}
      </div>
      <div className="controlStatusMeta">
        <span>{timezone}</span>
        <span className="controlStatusMetaSep">·</span>
        <span>{dateLabel}</span>
      </div>

      {scheduleMeta ? (
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
      ) : null}
    </section>
  )
}
