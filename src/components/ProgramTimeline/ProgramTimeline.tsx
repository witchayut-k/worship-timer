import { useRef, type ReactNode, type RefObject } from 'react'
import { useTimelineTrackBounds } from '../../hooks/useTimelineTrackBounds'

export type ProgramTimelineRowState = 'past' | 'current' | 'upcoming'

type ProgramTimelineProps = {
  className?: string
  children: ReactNode
}

export function ProgramTimeline({ className, children }: ProgramTimelineProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  useTimelineTrackBounds(contentRef, children)

  return (
    <div className={['programTimeline', className].filter(Boolean).join(' ')}>
      <div ref={contentRef} className="programTimelineContent">
        <div className="programTimelineTrack" aria-hidden />
        {children}
      </div>
    </div>
  )
}

type ProgramTimelineRowProps = {
  rowState: ProgramTimelineRowState
  startLabel: string | null
  endLabel: string | null
  children: ReactNode
  rowRef?: RefObject<HTMLDivElement | null>
  className?: string
}

function TimelineDot({ rowState }: { rowState: ProgramTimelineRowState }) {
  if (rowState === 'past') {
    return (
      <span className="programTimelineDot programTimelineDot--past" aria-hidden>
        <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
          {/* <circle cx="6" cy="6" r="5.5" stroke="currentColor" strokeWidth="1" /> */}
          <path
            d="M3.5 6l1.8 1.8L8.5 4.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    )
  }

  if (rowState === 'current') {
    return <span className="programTimelineDot programTimelineDot--current" aria-hidden />
  }

  return <span className="programTimelineDot programTimelineDot--upcoming" aria-hidden />
}

export function ProgramTimelineRow({
  rowState,
  startLabel,
  endLabel,
  children,
  rowRef,
  className,
}: ProgramTimelineRowProps) {
  const rangeAria =
    startLabel && endLabel ? `${startLabel} – ${endLabel}` : (startLabel ?? undefined)

  const rowClass = ['programTimelineRow', `programTimelineRow--${rowState}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <div ref={rowRef} className={rowClass}>
      <div className="programTimelineTime" aria-label={rangeAria}>
        {startLabel ? (
          <span className="programTimelineTimeStart">{startLabel}</span>
        ) : (
          <span
            className="programTimelineTimeStart programTimelineTimePlaceholder"
            aria-hidden
          >
            ···
          </span>
        )}
        {endLabel ? <span className="programTimelineTimeEnd">{endLabel}</span> : null}
      </div>
      <div className="programTimelineRail">
        <TimelineDot rowState={rowState} />
      </div>
      <div className="programTimelineCard">{children}</div>
    </div>
  )
}
