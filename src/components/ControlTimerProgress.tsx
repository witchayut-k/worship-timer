import { useMemo } from 'react'
import { formatSecToMmSs } from '../domain/time'
import { computeRingDash } from '../lib/stageProgress'

type Props = {
  remainingSec: number
  durationSec: number
}

const MILESTONE_RATIOS = [1, 0.75, 0.5, 0.25] as const

export function ControlTimerProgress({ remainingSec, durationSec }: Props) {
  const { remainingRatio } = useMemo(
    () => computeRingDash({ remainingSec, durationSec }),
    [remainingSec, durationSec],
  )

  const isOver = remainingSec < 0
  const duration = Math.max(0, durationSec)
  const fillPct = isOver ? 100 : Math.round(remainingRatio * 100)

  const milestones = useMemo(() => {
    if (duration <= 0) return []
    return MILESTONE_RATIOS.map((ratio) => ({
      ratio,
      label: formatSecToMmSs(duration * ratio),
      leftPct: (1 - ratio) * 100,
    }))
  }, [duration])

  return (
    <div className={`controlTimerProgress ${isOver ? 'controlTimerProgressOver' : ''}`} aria-hidden>
      <div className="controlTimerProgressTrack">
        <div className="controlTimerProgressFill" style={{ width: `${fillPct}%` }} />
        {milestones.map((m) => (
          <span
            key={m.ratio}
            className="controlTimerProgressTick"
            style={{ left: `${m.leftPct}%` }}
          />
        ))}
      </div>
      {milestones.length > 0 ? (
        <div className="controlTimerProgressLabels">
          {milestones.map((m) => (
            <span key={m.ratio} className="timeMono" style={{ left: `${m.leftPct}%` }}>
              {m.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
