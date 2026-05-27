import { useLayoutEffect, useRef } from 'react'

export function useStageDisplayScale(layoutWidth: number, layoutHeight: number, deps: unknown[] = []) {
  const frameRef = useRef<HTMLDivElement>(null)
  const scaleRef = useRef<HTMLDivElement>(null)
  const displayRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const frame = frameRef.current
    const scaleEl = scaleRef.current
    const display = displayRef.current
    if (!frame || !scaleEl || !display) return

    const measure = () => {
      const fitScale = Math.min(frame.clientWidth / layoutWidth, frame.clientHeight / layoutHeight)
      const safeScale = Math.max(0.08, fitScale)
      const fittedW = layoutWidth * safeScale
      const fittedH = layoutHeight * safeScale

      scaleEl.style.width = `${fittedW}px`
      scaleEl.style.height = `${fittedH}px`
      display.style.width = `${layoutWidth}px`
      display.style.height = `${layoutHeight}px`
      display.style.transform = `scale(${safeScale})`
      display.style.transformOrigin = 'top left'
    }

    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(frame)
    ro.observe(scaleEl)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutWidth, layoutHeight, ...deps])

  return { frameRef, scaleRef, displayRef }
}
