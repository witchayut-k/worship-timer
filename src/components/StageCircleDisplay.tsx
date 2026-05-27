import { useMemo, type CSSProperties } from 'react'
import { formatSignedMMSS } from '../domain/time'
import type { StageTheme } from '../lib/displayTheme'
import { computeRingDash } from '../lib/stageProgress'

export const STAGE_LAYOUT_PX = 520

const RING_RADIUS = 228
const FRAME_RADIUS = RING_RADIUS + 8
const SIZE = STAGE_LAYOUT_PX
const CENTER = SIZE / 2

const RING_STROKE = 12
const RING_GLOW_STROKE = 18

type SegmentLines = {
  kicker: string
  segment: string
  leader: string | null
}

type Props = {
  remainingSec: number
  durationSec: number
  currentName: string
  currentLeader: string
  nextName: string | null
  nextLeader: string | null
  theme: StageTheme
  paused?: boolean
}

function currentSegmentLines(name: string, leader: string): SegmentLines {
  const segment = name.trim().toUpperCase() || '—'
  const lead = leader.trim().toUpperCase()
  return {
    kicker: 'CURRENT SEGMENT',
    segment,
    leader: lead || null,
  }
}

function nextSegmentLines(name: string | null, leader: string | null): SegmentLines {
  if (!name?.trim()) {
    return { kicker: 'NEXT UP', segment: '—', leader: null }
  }
  const segment = name.trim().toUpperCase()
  const nextLead = leader?.trim().toUpperCase()
  return {
    kicker: 'NEXT UP',
    segment,
    leader: nextLead || null,
  }
}

function SegmentInsideRing({ lines, variant }: { lines: SegmentLines; variant: 'current' | 'next' }) {
  const rootClass =
    variant === 'current' ? 'stageSegmentInside stageSegmentInsideCurrent' : 'stageSegmentInside stageSegmentInsideNext'
  return (
    <div className={rootClass}>
      <div className="stageSegmentKicker">{lines.kicker}</div>
      <div className="stageSegmentName">{lines.segment}</div>
      {lines.leader ? <div className="stageSegmentLeader">{lines.leader}</div> : null}
    </div>
  )
}

export function StageCircleDisplay({
  remainingSec,
  durationSec,
  currentName,
  currentLeader,
  nextName,
  nextLeader,
  theme,
  paused = false,
}: Props) {
  const ring = useMemo(
    () => computeRingDash({ remainingSec, durationSec, radius: RING_RADIUS }),
    [remainingSec, durationSec],
  )

  const currentLines = currentSegmentLines(currentName, currentLeader)
  const nextLines = nextSegmentLines(nextName, nextLeader)
  const timeText = formatSignedMMSS(remainingSec)
  const speakerName = currentLeader.trim() || '—'
  const isOvertime = remainingSec < 0

  const centerLabel = paused ? 'PAUSED' : isOvertime ? 'OVERTIME' : 'REMAINING'

  const rootClass = `stageDisplay stageTheme-${theme.variant}${theme.flash ? ' stageFlash' : ''}${paused ? ' stagePaused' : ''}`
  const timerAriaLabel = paused
    ? `timer paused, ${timeText}`
    : isOvertime
      ? `overtime, ${timeText}`
      : 'timer'

  const style = {
    '--stage-accent': theme.accent,
    '--stage-glow': theme.glow,
    '--stage-muted': theme.muted,
    '--stage-secondary': theme.secondary,
    '--stage-secondary-glow': theme.secondaryGlow,
    '--stage-ring-inset': `${((CENTER - RING_RADIUS + RING_STROKE / 2 + 10) / CENTER) * 100}%`,
  } as CSSProperties

  return (
    <div className={rootClass} style={style}>
      <div className="stageCircleWrap">
        <svg
          className="stageSvg"
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          aria-hidden="true"
        >
          <defs>
            <filter id="stageProgressGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            className="stageRingFrame"
            cx={CENTER}
            cy={CENTER}
            r={FRAME_RADIUS}
            fill="none"
            strokeWidth={1.5}
          />

          <circle
            className="stageRingProgressGlow"
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_GLOW_STROKE}
            strokeDasharray={ring.dashArray}
            strokeDashoffset={ring.dashOffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            filter="url(#stageProgressGlow)"
          />

          <circle
            className="stageRingProgress"
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={RING_STROKE}
            strokeDasharray={ring.dashArray}
            strokeDashoffset={ring.dashOffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
        </svg>

        <div className="stageCenter">
          <div className="stageCenterTop">
            <SegmentInsideRing lines={currentLines} variant="current" />
            <div className="stageRemainingLabel">{centerLabel}</div>
          </div>
          <div className="stageTimerValue" aria-live="polite" aria-label={timerAriaLabel}>
            {timeText}
          </div>
          <div className="stageCenterBottom">
            <SegmentInsideRing lines={nextLines} variant="next" />
            <div className="stageSpeakerBlock">
              <div className="stageSpeakerLabel">SPEAKER</div>
              <div className="stageSpeakerName">{speakerName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
