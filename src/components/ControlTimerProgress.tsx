import { useMemo } from 'react'
import { formatSecToMmSs } from '../domain/time'
import { computeRingDash } from '../lib/stageProgress'

type Props = {
  remainingSec: number
  durationSec: number
}

const MILESTONE_ELAPSED = [0, 0.25, 0.5, 0.75, 1] as const

export function ControlTimerProgress({ remainingSec, durationSec }: Props) {
  const { remainingRatio } = useMemo(
    () => computeRingDash({ remainingSec, durationSec }),
    [remainingSec, durationSec],
  )

  const isOver = remainingSec < 0
  const duration = Math.max(0, durationSec)
  const fillPct = isOver ? 100 : Math.round((1 - remainingRatio) * 100)

  const milestones = useMemo(() => {
    if (duration <= 0) return []
    return MILESTONE_ELAPSED.map((elapsed) => ({
      elapsed,
      label: formatSecToMmSs(duration * elapsed),
      leftPct: elapsed * 100,
    }))
  }, [duration])

  return (
    <div className={`controlTimerProgress ${isOver ? 'controlTimerProgressOver' : ''}`} aria-hidden>
      <div className="controlTimerProgressTrack">
        <div className="controlTimerProgressFill" style={{ width: `${fillPct}%` }} />
        {milestones.map((m) => (
          <span
            key={m.elapsed}
            className="controlTimerProgressTick"
            style={{ left: `${m.leftPct}%` }}
          />
        ))}
      </div>
      {milestones.length > 0 ? (
        <div className="controlTimerProgressLabels">
          {milestones.map((m) => (
            <span key={m.elapsed} className="timeMono" style={{ left: `${m.leftPct}%` }}>
              {m.label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
