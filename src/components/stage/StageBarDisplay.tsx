import { useMemo, type CSSProperties } from 'react'
import { buildStageDisplayConfig, getStageTemplateConfig } from '../../config/stageTemplates.config'
import { getStageCssVars, getStageLayoutMetrics } from '../../config/stageDisplay.config'
import { formatSignedMMSS } from '../../domain/time'
import { getCenterLabel, getStageRootClass, getStageThemeStyle, getTimerAriaLabel } from '../../lib/stageDisplayRoot'
import { computeRemainingRatio } from '../../lib/stageProgress'
import { currentSegmentLines, nextSegmentLines } from '../../lib/stageSegmentLines'
import type { StageDisplayContentProps } from './StageDisplay.types'
import { StageLinearProgress } from './StageLinearProgress'
import { StageSegmentBlock } from './StageSegmentBlock'

const barTemplate = getStageTemplateConfig('bar')
const barConfig = buildStageDisplayConfig('bar')
const barMetrics = getStageLayoutMetrics(barConfig)

export function StageBarDisplay({
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
    ...getStageCssVars(barMetrics),
    ...getStageThemeStyle(theme),
    '--stage-layout-width': `${barTemplate.layoutWidth}px`,
    '--stage-layout-height': `${barTemplate.layoutHeight}px`,
  } as CSSProperties

  return (
    <div className={getStageRootClass(theme, paused, 'stageDisplay--bar')} style={style}>
      <div className="stageBarWrap">
        <div className="stageBarHeader">
          <div className="stageBarTimerRow">
            <div className="stageTimerValue" aria-live="polite" aria-label={getTimerAriaLabel(paused, isOvertime, timeText)}>
              {timeText}
            </div>
            <div className="stageRemainingLabel">{centerLabel}</div>
          </div>
          <StageLinearProgress ratio={remainingRatio} />
        </div>
        <div className="stageBarSegments">
          <div className="stageBarSegmentCol">
            <StageSegmentBlock lines={currentLines} variant="current" />
          </div>
          <div className="stageBarSegmentCol stageBarSegmentColNext">
            <StageSegmentBlock lines={nextLines} variant="next" />
          </div>
        </div>
      </div>
    </div>
  )
}
