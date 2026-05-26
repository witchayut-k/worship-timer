import { useMemo, type CSSProperties } from 'react'
import { formatSignedMMSS } from '../domain/time'
import type { StageTheme } from '../lib/displayTheme'
import { computeRingDash } from '../lib/stageProgress'

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

const RING_RADIUS = 196
const ARC_TEXT_RADIUS = RING_RADIUS + 32
const FRAME_RADIUS = RING_RADIUS + 28
const SIZE = 480
const CENTER = SIZE / 2

function buildTopLabel(name: string, leader: string): string {
  const segment = name.trim().toUpperCase() || '—'
  const lead = leader.trim().toUpperCase()
  if (lead) return `CURRENT SEGMENT — ${segment} — ${lead}`
  return `CURRENT SEGMENT — ${segment}`
}

function buildBottomLabel(name: string | null, leader: string | null): string {
  if (!name?.trim()) return 'NEXT UP: —'
  const segment = name.trim().toUpperCase()
  const nextLead = leader?.trim().toUpperCase()
  if (nextLead) return `NEXT UP: ${segment} — ${nextLead}`
  return `NEXT UP: ${segment}`
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

  const topLabel = buildTopLabel(currentName, currentLeader)
  const bottomLabel = buildBottomLabel(nextName, nextLeader)
  const timeText = formatSignedMMSS(remainingSec)
  const speakerName = currentLeader.trim() || '—'

  const rootClass = `stageDisplay stageTheme-${theme.variant}${theme.flash ? ' stageFlash' : ''}${paused ? ' stagePaused' : ''}`
  const timerAriaLabel = paused ? `timer paused, ${timeText}` : 'timer'

  const style = {
    '--stage-accent': theme.accent,
    '--stage-glow': theme.glow,
    '--stage-muted': theme.muted,
    '--stage-secondary': theme.secondary,
    '--stage-secondary-glow': theme.secondaryGlow,
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
            <path
              id="stageArcTop"
              d={`M ${CENTER - ARC_TEXT_RADIUS} ${CENTER} A ${ARC_TEXT_RADIUS} ${ARC_TEXT_RADIUS} 0 0 1 ${CENTER + ARC_TEXT_RADIUS} ${CENTER}`}
              fill="none"
            />
            <path
              id="stageArcBottom"
              d={`M ${CENTER - ARC_TEXT_RADIUS} ${CENTER} A ${ARC_TEXT_RADIUS} ${ARC_TEXT_RADIUS} 0 0 0 ${CENTER + ARC_TEXT_RADIUS} ${CENTER}`}
              fill="none"
            />
            <filter id="stageProgressGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="blur" />
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
            strokeWidth={28}
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
            strokeWidth={18}
            strokeDasharray={ring.dashArray}
            strokeDashoffset={ring.dashOffset}
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />

          <text className="stageArcText stageArcTextTop">
            <textPath href="#stageArcTop" startOffset="50%" textAnchor="middle">
              {topLabel}
            </textPath>
          </text>

          <text className="stageArcText stageArcTextBottom">
            <textPath href="#stageArcBottom" startOffset="50%" textAnchor="middle">
              {bottomLabel}
            </textPath>
          </text>
        </svg>

        <div className="stageCenter">
          <div className="stageRemainingLabel">{paused ? 'PAUSED' : 'REMAINING'}</div>
          <div className="stageTimerValue" aria-live="polite" aria-label={timerAriaLabel}>
            {timeText}
          </div>
          <div className="stageSpeakerBlock">
            <div className="stageSpeakerLabel">SPEAKER</div>
            <div className="stageSpeakerName">{speakerName}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
