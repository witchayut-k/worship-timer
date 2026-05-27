import { getStageLayoutDimensions } from '../config/stageTemplates.config'
import type { StageDisplayTemplate } from '../domain/types'
import { useStageDisplayScale } from '../hooks/useStageDisplayScale'
import type { StageTheme } from '../lib/displayTheme'
import { useLocale } from '../i18n/useLocale'
import { StageDisplay } from './StageDisplay'

type Props = {
  eventId: string
  stageTemplate: StageDisplayTemplate
  remainingSec: number
  durationSec: number
  currentName: string
  currentLeader: string
  nextName: string | null
  nextLeader: string | null
  theme: StageTheme
  paused?: boolean
}

function openStage(eventId: string) {
  window.open(`/view/${eventId}?kiosk=1`, '_blank', 'noopener,noreferrer')
}

export function StagePreview({
  eventId,
  stageTemplate,
  remainingSec,
  durationSec,
  currentName,
  currentLeader,
  nextName,
  nextLeader,
  theme,
  paused = false,
}: Props) {
  const { t } = useLocale()
  const { width, height } = getStageLayoutDimensions(stageTemplate)
  const { frameRef, scaleRef, displayRef } = useStageDisplayScale(width, height, [
    remainingSec,
    currentName,
    currentLeader,
    nextName,
    nextLeader,
    durationSec,
    stageTemplate,
  ])

  return (
    <div className="stagePreviewDock">
      <div className="stagePreviewHeader">
        <span className="stagePreviewLabel">{t('control.stagePreview')}</span>
        <button className="btnGhost btnSm" type="button" onClick={() => openStage(eventId)}>
          {t('control.openFullscreen')}
        </button>
      </div>
      <div className="stagePreviewFrame" ref={frameRef} aria-hidden>
        <div className="stagePreviewScale" ref={scaleRef}>
          <div ref={displayRef} className="stagePreviewDisplayWrap">
            <StageDisplay
              template={stageTemplate}
              remainingSec={remainingSec}
              durationSec={durationSec}
              currentName={currentName}
              currentLeader={currentLeader}
              nextName={nextName}
              nextLeader={nextLeader}
              theme={theme}
              paused={paused}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
