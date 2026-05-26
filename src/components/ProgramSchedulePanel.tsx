import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  computeSegmentPlannedStartMs,
  formatWallClockShort,
  parsePlannedStartMs,
} from '../domain/schedule'
import type { ProgramItem, RuntimePhase } from '../domain/types'
import { formatSecToMmSs, formatSignedMMSS } from '../domain/time'

type Props = {
  eventId: string
  items: ProgramItem[]
  currentIndex: number
  phase: RuntimePhase
  displayRemainingSec: number
  eventDate?: string
  plannedStartTime?: string
  onJumpTo: (index: number) => void
}

export function ProgramSchedulePanel({
  eventId,
  items,
  currentIndex,
  phase,
  displayRemainingSec,
  eventDate,
  plannedStartTime,
  onJumpTo,
}: Props) {
  const plannedStartMs = useMemo(() => {
    if (!eventDate?.trim() || !plannedStartTime?.trim()) return null
    return parsePlannedStartMs(eventDate, plannedStartTime, Date.now())
  }, [eventDate, plannedStartTime])

  return (
    <section className="programSchedule" aria-label="ตารางโปรแกรม">
      <div className="programScheduleHeader">
        <h2 className="programScheduleTitle">ตารางโปรแกรม</h2>
        <Link className="btnGhost btnSm" to={`/setup/${eventId}`}>
          แก้ไขโปรแกรม
        </Link>
      </div>

      <div className="programScheduleList">
        {items.map((it, idx) => {
          const isCurrent = idx === currentIndex
          const isPast = idx < currentIndex
          const isRunning = isCurrent && phase === 'running'
          const isPaused = isCurrent && phase === 'paused'
          const segmentStartMs =
            plannedStartMs != null ? computeSegmentPlannedStartMs(plannedStartMs, items, idx) : null
          const segmentStartLabel =
            segmentStartMs != null ? formatWallClockShort(segmentStartMs) : null

          return (
            <div
              key={`${it.order}-${it.name}-${idx}`}
              className={`programScheduleRow ${isCurrent ? 'active' : ''} ${isPast ? 'programScheduleRowPast' : ''}`}
            >
              <button
                type="button"
                className="listPick programSchedulePick"
                onClick={() => onJumpTo(idx)}
              >
                <div className="programScheduleRowTop">
                  <div className="listPickTitle">
                    {it.order}. {it.name}
                  </div>
                  {isRunning ? (
                    <span className="scheduleBadge scheduleBadgeCurrent">Current</span>
                  ) : isPaused ? (
                    <span className="scheduleBadge scheduleBadgePaused">Paused</span>
                  ) : null}
                </div>
                <div className="programScheduleRowMeta">
                  <span className="muted">{it.leaderName || '—'}</span>
                  <span className="programScheduleRowTimes">
                    {segmentStartLabel ? (
                      <span className="timeMono muted programSchedulePlanned">{segmentStartLabel}</span>
                    ) : null}
                    {isCurrent ? (
                      <span className="timeMono programScheduleTime">
                        {formatSignedMMSS(displayRemainingSec)}
                      </span>
                    ) : (
                      <span className="timeMono muted">{formatSecToMmSs(it.durationSec)}</span>
                    )}
                  </span>
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
