import { useLayoutEffect, useRef } from 'react'
import { StageCircleDisplay } from './StageCircleDisplay'
import type { StageTheme } from '../lib/displayTheme'

const STAGE_LAYOUT_PX = 480

type Props = {
  eventId: string
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
  remainingSec,
  durationSec,
  currentName,
  currentLeader,
  nextName,
  nextLeader,
  theme,
  paused = false,
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef<HTMLDivElement>(null)
  const displayRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const frame = frameRef.current
    const scaleEl = scaleRef.current
    const display = displayRef.current
    if (!frame || !scaleEl || !display) return

    const measure = () => {
      const fitScale = Math.min(
        frame.clientWidth / STAGE_LAYOUT_PX,
        frame.clientHeight / STAGE_LAYOUT_PX,
      )
      const safeScale = Math.max(0.08, fitScale)
      const fittedW = STAGE_LAYOUT_PX * safeScale
      const fittedH = STAGE_LAYOUT_PX * safeScale

      scaleEl.style.width = `${fittedW}px`
      scaleEl.style.height = `${fittedH}px`
      display.style.width = `${STAGE_LAYOUT_PX}px`
      display.style.height = `${STAGE_LAYOUT_PX}px`
      display.style.transform = `scale(${safeScale})`
      display.style.transformOrigin = 'top left'
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(frame)
    ro.observe(scaleEl)
    return () => ro.disconnect()
  }, [
    remainingSec,
    currentName,
    currentLeader,
    nextName,
    nextLeader,
    durationSec,
  ])

  return (
    <div className="stagePreviewDock">
      <div className="stagePreviewHeader">
        <span className="stagePreviewLabel">Preview จอ Stage</span>
        <button className="btnGhost btnSm" type="button" onClick={() => openStage(eventId)}>
          เปิดจอเต็ม
        </button>
      </div>
      <div className="stagePreviewFrame" ref={frameRef} aria-hidden>
        <div className="stagePreviewScale" ref={scaleRef}>
          <div ref={displayRef} className="stagePreviewDisplayWrap">
            <StageCircleDisplay
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
