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
}

const RING_RADIUS = 200
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
}: Props) {
  const ring = useMemo(
    () => computeRingDash({ remainingSec, durationSec, radius: RING_RADIUS }),
    [remainingSec, durationSec],
  )

  const topLabel = buildTopLabel(currentName, currentLeader)
  const bottomLabel = buildBottomLabel(nextName, nextLeader)
  const timeText = formatSignedMMSS(remainingSec)
  const speakerName = currentLeader.trim() || '—'

  const rootClass = `stageDisplay stageTheme-${theme.variant}${theme.flash ? ' stageFlash' : ''}`

  const style = {
    '--stage-accent': theme.accent,
    '--stage-glow': theme.glow,
    '--stage-muted': theme.muted,
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
              d={`M ${CENTER - RING_RADIUS - 28} ${CENTER} A ${RING_RADIUS + 28} ${RING_RADIUS + 28} 0 0 1 ${CENTER + RING_RADIUS + 28} ${CENTER}`}
              fill="none"
            />
            <path
              id="stageArcBottom"
              d={`M ${CENTER + RING_RADIUS + 28} ${CENTER} A ${RING_RADIUS + 28} ${RING_RADIUS + 28} 0 0 1 ${CENTER - RING_RADIUS - 28} ${CENTER}`}
              fill="none"
            />
          </defs>

          <circle
            className="stageRingTrack"
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={6}
          />

          <circle
            className="stageRingProgress"
            cx={CENTER}
            cy={CENTER}
            r={RING_RADIUS}
            fill="none"
            strokeWidth={14}
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
          <div className="stageRemainingLabel">REMAINING</div>
          <div className="stageTimerValue" aria-live="polite" aria-label="timer">
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
