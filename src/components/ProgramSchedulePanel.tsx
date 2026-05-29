import {
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  computeSegmentPlannedStartMs,
  formatWallClockShort,
  parsePlannedStartMs,
} from '../domain/schedule'
import type { ProgramItem, RuntimePhase } from '../domain/types'
import { formatSecToMmSs, formatSignedMMSS } from '../domain/time'
import { useLocale } from '../i18n/useLocale'
import { LightingCueIcon, MediaCueIcon } from './CrewCueIcons'

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

function padOrder(order: number): string {
  return String(order).padStart(2, '0')
}

function CrewNotes({ item }: { item: ProgramItem }) {
  const { t } = useLocale()
  const lights = item.roomLights?.trim()
  const media = item.mediaNote?.trim()
  if (!lights && !media) return null

  return (
    <div className="programScheduleCrewNotes">
      {lights ? (
        <div
          className="programScheduleCrewNote programScheduleCrewNote--lighting"
          aria-label={t('crew.lightingCue')}
        >
          <LightingCueIcon className="programScheduleCrewNoteIcon" />
          <span className="programScheduleCrewNoteText">{lights}</span>
        </div>
      ) : null}
      {media ? (
        <div
          className="programScheduleCrewNote programScheduleCrewNote--media"
          aria-label={t('crew.mediaCue')}
        >
          <MediaCueIcon className="programScheduleCrewNoteIcon" />
          <span className="programScheduleCrewNoteText">{media}</span>
        </div>
      ) : null}
    </div>
  )
}

type RowProps = {
  item: ProgramItem
  idx: number
  isCurrent: boolean
  isPast: boolean
  phase: RuntimePhase
  displayRemainingSec?: number
  segmentStartLabel: string | null
  showCrewNotes: boolean
  readOnly: boolean
  onJumpTo?: (index: number) => void
  rowRef?: RefObject<HTMLDivElement | null>
}

const ProgramScheduleRow = memo(function ProgramScheduleRow({
  item,
  idx,
  isCurrent,
  isPast,
  phase,
  displayRemainingSec,
  segmentStartLabel,
  showCrewNotes,
  readOnly,
  onJumpTo,
  rowRef,
}: RowProps) {
  const { t } = useLocale()
  const isRunning = isCurrent && phase === 'running'
  const isPaused = isCurrent && phase === 'paused'

  const aside = isPast ? (
    <span className="programScheduleStatusLabel programScheduleStatusLabelDone">
      {t('control.scheduleDone')}
    </span>
  ) : isCurrent ? (
    <div className="programScheduleAsideStack">
      {isRunning ? (
        <span className="programScheduleStatusLabel programScheduleStatusLabelLive">
          {t('control.scheduleLive')}
        </span>
      ) : isPaused ? (
        <span className="programScheduleStatusLabel programScheduleStatusLabelPaused">
          {t('control.paused')}
        </span>
      ) : null}
      {displayRemainingSec != null ? (
        <span className="timeMono programScheduleTime">{formatSignedMMSS(displayRemainingSec)}</span>
      ) : null}
    </div>
  ) : (
    <div className="programScheduleAsideStack">
      {segmentStartLabel ? (
        <span className="muted programSchedulePlanned">{segmentStartLabel}</span>
      ) : null}
      <span className="muted programScheduleDuration">{formatSecToMmSs(item.durationSec)}</span>
    </div>
  )

  const pickContent = (
    <>
      <span className="programScheduleOrder" aria-hidden>
        {padOrder(item.order)}
      </span>
      <div className="programScheduleMain">
        <div className="programScheduleItemTitle">{item.name}</div>
        <div className="programScheduleLeader muted">{item.leaderName || '—'}</div>
        {showCrewNotes ? <CrewNotes item={item} /> : null}
      </div>
      <div className="programScheduleAside">{aside}</div>
    </>
  )

  const rowClass = [
    'programScheduleRow',
    isCurrent ? 'active' : '',
    isPast ? 'programScheduleRowPast' : '',
  ]
    .filter(Boolean)
    .join(' ')

  let pick: ReactNode
  if (readOnly) {
    pick = (
      <div className="programSchedulePick programSchedulePickReadOnly">{pickContent}</div>
    )
  } else {
    pick = (
      <button
        type="button"
        className="programSchedulePick"
        onClick={() => onJumpTo?.(idx)}
      >
        {pickContent}
      </button>
    )
  }

  return (
    <div ref={rowRef} className={rowClass}>
      {pick}
    </div>
  )
})

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
          const segmentStartMs =
            plannedStartMs != null ? computeSegmentPlannedStartMs(plannedStartMs, items, idx) : null
          const segmentStartLabel =
            segmentStartMs != null ? formatWallClockShort(segmentStartMs) : null

          return (
            <ProgramScheduleRow
              key={`${it.order}-${it.name}-${idx}`}
              item={it}
              idx={idx}
              isCurrent={isCurrent}
              isPast={idx < currentIndex}
              phase={phase}
              displayRemainingSec={isCurrent ? displayRemainingSec : undefined}
              segmentStartLabel={segmentStartLabel}
              showCrewNotes={showCrewNotes}
              readOnly={readOnly}
              onJumpTo={onJumpTo}
              rowRef={isCurrent ? activeRowRef : undefined}
            />
          )
        })}
      </div>
    </section>
  )
}
