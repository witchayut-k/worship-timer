import { useEffect, useMemo, useRef, useState } from 'react'
import {
  computeSegmentPlannedStartMs,
  formatWallClockShort,
  parsePlannedStartMs,
} from '../domain/schedule'
import type { ProgramItem, RuntimePhase } from '../domain/types'
import { formatSecToMmSs, formatSignedMMSS } from '../domain/time'
import { useLocale } from '../i18n/useLocale'

type BaseProps = {
  eventId: string
  items: ProgramItem[]
  currentIndex: number
  phase: RuntimePhase
  displayRemainingSec: number
  eventDate?: string
  plannedStartTime?: string
  readOnly?: boolean
  showCrewNotes?: boolean
  scrollActiveIntoView?: boolean
  className?: string
  listClassName?: string
}

type Props = BaseProps & {
  onJumpTo?: (index: number) => void
}

function CrewNotes({ item }: { item: ProgramItem }) {
  const { t } = useLocale()
  const lights = item.roomLights?.trim()
  const media = item.mediaNote?.trim()
  if (!lights && !media) return null

  return (
    <div className="programScheduleCrewNotes">
      {lights ? (
        <div className="programScheduleCrewNote">
          <span className="programScheduleCrewNoteLabel">{t('setupSegment.lights')}</span>
          <span>{lights}</span>
        </div>
      ) : null}
      {media ? (
        <div className="programScheduleCrewNote">
          <span className="programScheduleCrewNoteLabel">{t('setupSegment.media')}</span>
          <span>{media}</span>
        </div>
      ) : null}
    </div>
  )
}

export function ProgramSchedulePanel({
  items,
  currentIndex,
  phase,
  displayRemainingSec,
  eventDate,
  plannedStartTime,
  onJumpTo,
  readOnly = false,
  showCrewNotes = false,
  scrollActiveIntoView = false,
  className,
  listClassName,
}: Props) {
  const { t } = useLocale()
  const [nowMs] = useState(() => Date.now())
  const activeRowRef = useRef<HTMLDivElement>(null)
  const plannedStartMs = useMemo(() => {
    if (!eventDate?.trim() || !plannedStartTime?.trim()) return null
    return parsePlannedStartMs(eventDate, plannedStartTime, nowMs)
  }, [eventDate, plannedStartTime, nowMs])

  useEffect(() => {
    if (!scrollActiveIntoView) return
    activeRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentIndex, scrollActiveIntoView])

  const sectionClass = ['programSchedule', className].filter(Boolean).join(' ')
  const listClass = ['programScheduleList', listClassName].filter(Boolean).join(' ')

  return (
    <section className={sectionClass} aria-label={t('control.programSchedule')}>
      <div className="programScheduleHeader">
        <h2 className="programScheduleTitle">{t('control.programSchedule')}</h2>
      </div>

      <div className={listClass}>
        {items.map((it, idx) => {
          const isCurrent = idx === currentIndex
          const isPast = idx < currentIndex
          const isRunning = isCurrent && phase === 'running'
          const isPaused = isCurrent && phase === 'paused'
          const segmentStartMs =
            plannedStartMs != null ? computeSegmentPlannedStartMs(plannedStartMs, items, idx) : null
          const segmentStartLabel =
            segmentStartMs != null ? formatWallClockShort(segmentStartMs) : null

          const rowContent = (
            <>
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
              {showCrewNotes ? <CrewNotes item={it} /> : null}
            </>
          )

          return (
            <div
              key={`${it.order}-${it.name}-${idx}`}
              ref={isCurrent ? activeRowRef : undefined}
              className={`programScheduleRow ${isCurrent ? 'active' : ''} ${isPast ? 'programScheduleRowPast' : ''}`}
            >
              {readOnly ? (
                <div className="listPick programSchedulePick programSchedulePickReadOnly">
                  {rowContent}
                </div>
              ) : (
                <button
                  type="button"
                  className="listPick programSchedulePick"
                  onClick={() => onJumpTo?.(idx)}
                >
                  {rowContent}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
