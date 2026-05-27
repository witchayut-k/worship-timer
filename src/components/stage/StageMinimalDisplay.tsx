import { useMemo, type CSSProperties } from 'react'
import { buildStageDisplayConfig } from '../../config/stageTemplates.config'
import { getStageCssVars, getStageLayoutMetrics } from '../../config/stageDisplay.config'
import { formatSignedMMSS } from '../../domain/time'
import { getCenterLabel, getStageRootClass, getStageThemeStyle, getTimerAriaLabel } from '../../lib/stageDisplayRoot'
import { computeRemainingRatio } from '../../lib/stageProgress'
import { currentSegmentLines, nextSegmentLines } from '../../lib/stageSegmentLines'
import type { StageDisplayContentProps } from './StageDisplay.types'
import { StageLinearProgress } from './StageLinearProgress'
import { StageSegmentBlock } from './StageSegmentBlock'

const minimalConfig = buildStageDisplayConfig('minimal')
const minimalMetrics = getStageLayoutMetrics(minimalConfig)

export function StageMinimalDisplay({
  remainingSec,
  durationSec,
  currentName,
  currentLeader,
  nextName,
  nextLeader,
  theme,
  paused = false,
}: StageDisplayContentProps) {
  const remainingRatio = useMemo(
    () => computeRemainingRatio(remainingSec, durationSec),
    [remainingSec, durationSec],
  )

  const currentLines = currentSegmentLines(currentName, currentLeader)
  const nextLines = nextSegmentLines(nextName, nextLeader)
  const timeText = formatSignedMMSS(remainingSec)
  const isOvertime = remainingSec < 0
  const centerLabel = getCenterLabel(paused, isOvertime)

  const style = {
    ...getStageCssVars(minimalMetrics),
    ...getStageThemeStyle(theme),
  } as CSSProperties

  return (
    <div className={getStageRootClass(theme, paused, 'stageDisplay--minimal')} style={style}>
      <div className="stageMinimalWrap">
        <div className="stageMinimalTop">
          <StageSegmentBlock lines={currentLines} variant="current" />
        </div>
        <div className="stageMinimalCenter">
          <div className="stageRemainingLabel">{centerLabel}</div>
          <div className="stageTimerValue" aria-live="polite" aria-label={getTimerAriaLabel(paused, isOvertime, timeText)}>
            {timeText}
          </div>
        </div>
        <div className="stageMinimalBottom">
          <StageSegmentBlock lines={nextLines} variant="next" />
          <StageLinearProgress ratio={remainingRatio} />
        </div>
      </div>
    </div>
  )
}
