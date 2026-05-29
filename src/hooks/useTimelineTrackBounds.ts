import { useLayoutEffect, type RefObject } from 'react'

function dotCenterYRelativeTo(content: HTMLElement, dot: HTMLElement): number {
  const contentRect = content.getBoundingClientRect()
  const dotRect = dot.getBoundingClientRect()
  return dotRect.top + dotRect.height / 2 - contentRect.top
}

function measureTrackBounds(content: HTMLElement): void {
  const dots = content.querySelectorAll<HTMLElement>('.programTimelineDot')
  if (dots.length === 0) {
    content.style.setProperty('--pt-track-top', '0px')
    content.style.setProperty('--pt-track-height', '0px')
    return
  }

  const firstCenter = dotCenterYRelativeTo(content, dots[0]!)
  const lastCenter = dotCenterYRelativeTo(content, dots[dots.length - 1]!)

  const topPx = Math.max(0, firstCenter)
  const heightPx = Math.max(0, lastCenter - firstCenter)

  content.style.setProperty('--pt-track-top', `${topPx}px`)
  content.style.setProperty('--pt-track-height', `${heightPx}px`)
}

export function useTimelineTrackBounds(
  contentRef: RefObject<HTMLElement | null>,
  layoutKey: unknown,
): void {
  useLayoutEffect(() => {
    const content = contentRef.current
    if (!content) return

    const update = () => measureTrackBounds(content)

    update()

    const observer = new ResizeObserver(update)
    observer.observe(content)

    return () => observer.disconnect()
  }, [contentRef, layoutKey])
}
