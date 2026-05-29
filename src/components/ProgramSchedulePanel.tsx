import {
  memo,
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import type { ProgramItem, RuntimePhase } from '../domain/types'
import { formatSecToMmSs, formatSignedMMSS } from '../domain/time'
import { useLocale } from '../i18n/useLocale'
import { usePlannedSegmentSchedule } from '../hooks/usePlannedSegmentSchedule'
import { useScheduleViewPrefs } from '../hooks/useScheduleViewPrefs'
import { getLiveDotStyle, type StageTheme } from '../lib/displayTheme'
import { resolveScheduleViewLayout } from '../lib/scheduleViewLayout'
import { ProgramTimeline, ProgramTimelineRow } from './ProgramTimeline'
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
  liveDotTheme?: StageTheme | null
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

type RowContentProps = {
  item: ProgramItem
  idx: number
  isCurrent: boolean
  isPast: boolean
  phase: RuntimePhase
  displayRemainingSec?: number
  showCrewNotes: boolean
  showDurationFallback: boolean
  showRowTimes: boolean
}

function ScheduleRowAside({
  isPast,
  isCurrent,
  phase,
  displayRemainingSec,
  item,
  showDurationFallback,
  showRowTimes,
}: Omit<RowContentProps, 'idx' | 'showCrewNotes' | 'item'> & { item: ProgramItem }) {
  const { t } = useLocale()
  const isRunning = isCurrent && phase === 'running'
  const isPaused = isCurrent && phase === 'paused'

  if (isPast) {
    return (
      <span className="programScheduleStatusLabel programScheduleStatusLabelDone">
        {t('control.scheduleDone')}
      </span>
    )
  }

  if (isCurrent) {
    return (
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
        {showRowTimes && displayRemainingSec != null ? (
          <span className="timeMono programScheduleTime">{formatSignedMMSS(displayRemainingSec)}</span>
        ) : null}
      </div>
    )
  }

  if (showRowTimes && showDurationFallback) {
    return (
      <span className="muted programScheduleDuration">{formatSecToMmSs(item.durationSec)}</span>
    )
  }

  return null
}

type ScheduleRowProps = RowContentProps & {
  readOnly: boolean
  onJumpTo?: (index: number) => void
  rowRef?: RefObject<HTMLDivElement | null>
  useTimelineLayout: boolean
}

const ProgramScheduleRow = memo(function ProgramScheduleRow({
  item,
  idx,
  isCurrent,
  isPast,
  phase,
  displayRemainingSec,
  showCrewNotes,
  showDurationFallback,
  showRowTimes,
  readOnly,
  onJumpTo,
  rowRef,
  useTimelineLayout,
}: ScheduleRowProps) {
  const pickBody = (
    <>
      {!useTimelineLayout ? (
        <span className="programScheduleOrder" aria-hidden>
          {padOrder(item.order)}
        </span>
      ) : null}
      <div className="programScheduleMain">
        <div className="programScheduleItemTitle">{item.name}</div>
        <div className="programScheduleLeader muted">{item.leaderName || '—'}</div>
        {showCrewNotes ? <CrewNotes item={item} /> : null}
      </div>
      <div className="programScheduleAside">
        <ScheduleRowAside
          item={item}
          isPast={isPast}
          isCurrent={isCurrent}
          phase={phase}
          displayRemainingSec={displayRemainingSec}
          showDurationFallback={showDurationFallback}
          showRowTimes={showRowTimes}
        />
      </div>
    </>
  )

  const pickClass = [
    'programSchedulePick',
    useTimelineLayout ? 'programTimelinePick' : '',
    readOnly ? 'programSchedulePickReadOnly' : '',
  ]
    .filter(Boolean)
    .join(' ')

  let pick: ReactNode
  if (readOnly) {
    pick = <div className={pickClass}>{pickBody}</div>
  } else {
    pick = (
      <button type="button" className={pickClass} onClick={() => onJumpTo?.(idx)}>
        {pickBody}
      </button>
    )
  }

  const rowClass = [
    'programScheduleRow',
    isCurrent ? 'active' : '',
    isPast ? 'programScheduleRowPast' : '',
  ]
    .filter(Boolean)
    .join(' ')

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
  liveDotTheme = null,
}: Props) {
  const { t } = useLocale()
  const { prefs } = useScheduleViewPrefs()
  const activeRowRef = useRef<HTMLDivElement>(null)
  const schedule = usePlannedSegmentSchedule(items, eventDate, plannedStartTime)
  const layout = resolveScheduleViewLayout(schedule.enabled, prefs)
  const effectiveShowCrewNotes = showCrewNotes && prefs.showCrewNotes

  useEffect(() => {
    if (!scrollActiveIntoView) return
    activeRowRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentIndex, scrollActiveIntoView])

  const sectionClass = ['programSchedule', className].filter(Boolean).join(' ')
  const listClass = ['programScheduleList', listClassName].filter(Boolean).join(' ')

  const renderRow = (idx: number) => {
    const it = items[idx]
    if (!it) return null

    const isCurrent = idx === currentIndex
    const isPast = idx < currentIndex
    const rowState = isPast ? 'past' : isCurrent ? 'current' : 'upcoming'
    const plannedRow = schedule.enabled ? schedule.rows[idx] : null

    const rowProps: ScheduleRowProps = {
      item: it,
      idx,
      isCurrent,
      isPast,
      phase,
      displayRemainingSec: isCurrent ? displayRemainingSec : undefined,
      showCrewNotes: effectiveShowCrewNotes,
      showDurationFallback: layout.showDurationFallback,
      showRowTimes: layout.showRowTimes,
      readOnly,
      onJumpTo,
      rowRef: isCurrent ? activeRowRef : undefined,
      useTimelineLayout: layout.useTimelinePickLayout,
    }

    if (!layout.useTimelineWrapper) {
      return <ProgramScheduleRow key={`${it.order}-${it.name}-${idx}`} {...rowProps} />
    }

    return (
      <ProgramTimelineRow
        key={`${it.order}-${it.name}-${idx}`}
        rowState={rowState}
        startLabel={plannedRow?.startLabel ?? null}
        endLabel={plannedRow?.endLabel ?? null}
        hideTimeColumn={!layout.showPlannedTimes}
        rowRef={isCurrent ? activeRowRef : undefined}
        className={[
          'programScheduleTimelineRow',
          isCurrent ? 'programScheduleTimelineRowActive' : '',
          isPast ? 'programScheduleTimelineRowPast' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        currentDotStyle={isCurrent ? getLiveDotStyle(liveDotTheme) : undefined}
      >
        <ProgramScheduleRow {...rowProps} />
      </ProgramTimelineRow>
    )
  }

  return (
    <section className={sectionClass} aria-label={t('control.programSchedule')}>
      <div className="programScheduleHeader">
        <h2 className="programScheduleTitle">{t('control.programSchedule')}</h2>
        {layout.showPlannedTimes && schedule.enabled ? (
          <span className="programScheduleEndsChip muted">
            {t('schedule.programEndsAt', { time: schedule.programEndLabel })}
          </span>
        ) : null}
      </div>

      {layout.useTimelineWrapper ? (
        <ProgramTimeline className={listClass}>{items.map((_, idx) => renderRow(idx))}</ProgramTimeline>
      ) : (
        <div className={listClass}>{items.map((_, idx) => renderRow(idx))}</div>
      )}
    </section>
  )
}
