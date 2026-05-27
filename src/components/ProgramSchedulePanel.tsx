import { useMemo, useState } from 'react'
import {
  computeSegmentPlannedStartMs,
  formatWallClockShort,
  parsePlannedStartMs,
} from '../domain/schedule'
import type { ProgramItem, RuntimePhase } from '../domain/types'
import { formatSecToMmSs, formatSignedMMSS } from '../domain/time'
import { useLocale } from '../i18n/useLocale'

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
  items,
  currentIndex,
  phase,
  displayRemainingSec,
  eventDate,
  plannedStartTime,
  onJumpTo,
}: Props) {
  const { t } = useLocale()
  const [nowMs] = useState(() => Date.now())
  const plannedStartMs = useMemo(() => {
    if (!eventDate?.trim() || !plannedStartTime?.trim()) return null
    return parsePlannedStartMs(eventDate, plannedStartTime, nowMs)
  }, [eventDate, plannedStartTime, nowMs])

  return (
    <section className="programSchedule" aria-label={t('control.programSchedule')}>
      <div className="programScheduleHeader">
        <h2 className="programScheduleTitle">{t('control.programSchedule')}</h2>
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
                    <span className="scheduleBadge scheduleBadgeCurrent">{t('control.current')}</span>
                  ) : isPaused ? (
                    <span className="scheduleBadge scheduleBadgePaused">{t('control.paused')}</span>
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
