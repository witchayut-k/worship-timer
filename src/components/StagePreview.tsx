import { StageCircleDisplay } from './StageCircleDisplay'
import type { StageTheme } from '../lib/displayTheme'

type Props = {
  eventId: string
  remainingSec: number
  durationSec: number
  currentName: string
  currentLeader: string
  nextName: string | null
  nextLeader: string | null
  theme: StageTheme
}

function openStage(eventId: string) {
  window.open(`/view/${eventId}?kiosk=1`, '_blank', 'noopener,noreferrer')
}

export function StagePreview({
  eventId,
  remainingSec,
  durationSec,
  currentName,
  currentLeader,
  nextName,
  nextLeader,
  theme,
}: Props) {
  return (
    <div className="stagePreviewDock">
      <div className="stagePreviewHeader">
        <span className="stagePreviewLabel">Preview จอ Stage</span>
        <button className="btnGhost btnSm" type="button" onClick={() => openStage(eventId)}>
          เปิดจอเต็ม
        </button>
      </div>
      <div className="stagePreviewFrame" aria-hidden>
        <div className="stagePreviewScale">
          <StageCircleDisplay
            remainingSec={remainingSec}
            durationSec={durationSec}
            currentName={currentName}
            currentLeader={currentLeader}
            nextName={nextName}
            nextLeader={nextLeader}
            theme={theme}
          />
        </div>
      </div>
    </div>
  )
}
