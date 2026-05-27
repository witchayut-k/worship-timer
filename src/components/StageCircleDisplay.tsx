import { useMemo, type CSSProperties } from 'react'
import { stageDisplayConfig, getStageCssVars, getStageLayoutMetrics } from '../config/stageDisplay.config'
import { formatSignedMMSS } from '../domain/time'
import { getCenterLabel, getStageRootClass, getStageThemeStyle, getTimerAriaLabel } from '../lib/stageDisplayRoot'
import { computeRingDash } from '../lib/stageProgress'
import { currentSegmentLines, nextSegmentLines } from '../lib/stageSegmentLines'
import type { StageDisplayContentProps } from './stage/StageDisplay.types'
import { StageSegmentBlock } from './stage/StageSegmentBlock'

export { STAGE_LAYOUT_PX } from '../config/stageDisplay.config'

const stageMetrics = getStageLayoutMetrics(stageDisplayConfig)

export function StageCircleDisplay({
  remainingSec,
  durationSec,
  currentName,
  currentLeader,
  nextName,
  nextLeader,
  theme,
  paused = false,
}: StageDisplayContentProps) {
  const ring = useMemo(
    () => computeRingDash({ remainingSec, durationSec, radius: stageMetrics.ringRadius }),
    [remainingSec, durationSec],
  )

  const currentLines = currentSegmentLines(currentName, currentLeader)
  const nextLines = nextSegmentLines(nextName, nextLeader)
  const timeText = formatSignedMMSS(remainingSec)
  const isOvertime = remainingSec < 0
  const centerLabel = getCenterLabel(paused, isOvertime)

  const style = {
    ...getStageCssVars(stageMetrics),
    ...getStageThemeStyle(theme),
  } as CSSProperties

  const { center, layoutPx, ringRadius, ringStroke, ringGlowStroke, frameRadius, frameStroke, glowBlur } =
    stageMetrics

  return (
    <div className={getStageRootClass(theme, paused, 'stageDisplay--circle')} style={style}>
      <div className="stageCircleWrap">
        <svg className="stageSvg" viewBox={`0 0 ${layoutPx} ${layoutPx}`} aria-hidden="true">
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
            <StageSegmentBlock lines={currentLines} variant="current" />
            <div className="stageRemainingLabel">{centerLabel}</div>
          </div>
          <div className="stageTimerValue" aria-live="polite" aria-label={getTimerAriaLabel(paused, isOvertime, timeText)}>
            {timeText}
          </div>
          <div className="stageCenterBottom">
            <StageSegmentBlock lines={nextLines} variant="next" />
          </div>
        </div>
      </div>
    </div>
  )
}
