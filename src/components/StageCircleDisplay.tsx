import { useMemo, type CSSProperties } from 'react'
import {
  getStageCssVars,
  getStageLayoutMetrics,
  STAGE_LAYOUT_PX,
  stageDisplayConfig,
} from '../config/stageDisplay.config'
import { formatSignedMMSS } from '../domain/time'
import type { StageTheme } from '../lib/displayTheme'
import { computeRingDash } from '../lib/stageProgress'

export { STAGE_LAYOUT_PX }

const stageMetrics = getStageLayoutMetrics(stageDisplayConfig)

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
    () => computeRingDash({ remainingSec, durationSec, radius: stageMetrics.ringRadius }),
    [remainingSec, durationSec],
  )

  const currentLines = currentSegmentLines(currentName, currentLeader)
  const nextLines = nextSegmentLines(nextName, nextLeader)
  const timeText = formatSignedMMSS(remainingSec)
  const isOvertime = remainingSec < 0

  const centerLabel = paused ? 'PAUSED' : isOvertime ? 'OVERTIME' : 'REMAINING'

  const rootClass = `stageDisplay stageTheme-${theme.variant}${theme.flash ? ' stageFlash' : ''}${paused ? ' stagePaused' : ''}`
  const timerAriaLabel = paused
    ? `timer paused, ${timeText}`
    : isOvertime
      ? `overtime, ${timeText}`
      : 'timer'

  const style = {
    ...getStageCssVars(stageMetrics),
    '--stage-accent': theme.accent,
    '--stage-glow': theme.glow,
    '--stage-muted': theme.muted,
    '--stage-secondary': theme.secondary,
    '--stage-secondary-glow': theme.secondaryGlow,
  } as CSSProperties

  const { center, layoutPx, ringRadius, ringStroke, ringGlowStroke, frameRadius, frameStroke, glowBlur } =
    stageMetrics

  return (
    <div className={rootClass} style={style}>
      <div className="stageCircleWrap">
        <svg
          className="stageSvg"
          viewBox={`0 0 ${layoutPx} ${layoutPx}`}
          aria-hidden="true"
        >
          <defs>
            <filter id="stageProgressGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={glowBlur} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <circle
            className="stageRingFrame"
            cx={center}
            cy={center}
            r={frameRadius}
            fill="none"
            strokeWidth={frameStroke}
          />

          <circle
            className="stageRingProgressGlow"
            cx={center}
            cy={center}
            r={ringRadius}
            fill="none"
            strokeWidth={ringGlowStroke}
            strokeDasharray={ring.dashArray}
            strokeDashoffset={ring.dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
            filter="url(#stageProgressGlow)"
          />

          <circle
            className="stageRingProgress"
            cx={center}
            cy={center}
            r={ringRadius}
            fill="none"
            strokeWidth={ringStroke}
            strokeDasharray={ring.dashArray}
            strokeDashoffset={ring.dashOffset}
            transform={`rotate(-90 ${center} ${center})`}
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
          </div>
        </div>
      </div>
    </div>
  )
}
