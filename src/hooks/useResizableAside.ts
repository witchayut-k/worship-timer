import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import {
  clampPanelWidth,
  DEFAULT_PANEL_WIDTH,
  getPanelBounds,
} from '../lib/resizablePanelBounds'

const STORAGE_KEY = 'worship-timer.setupAsideWidth'
const GUTTER_SIZE = 8

function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PANEL_WIDTH
    const n = Number.parseInt(raw, 10)
    if (!Number.isFinite(n)) return DEFAULT_PANEL_WIDTH
    return n
  } catch {
    return DEFAULT_PANEL_WIDTH
  }
}

function persistAsideWidth(width: number) {
  try {
    localStorage.setItem(STORAGE_KEY, String(width))
  } catch {
    // ignore
  }
}

export function useResizableAside() {
  const gridRef = useRef<HTMLDivElement>(null)
  const [asideWidth, setAsideWidth] = useState(readStoredWidth)
  const [asideBounds, setAsideBounds] = useState(() => getPanelBounds(undefined))
  const [isResizing, setIsResizing] = useState(false)
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const onGutterPointerDown = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      if (!gridRef.current) return
      dragRef.current = { startX: e.clientX, startWidth: asideWidth }
      setIsResizing(true)
      e.currentTarget.setPointerCapture(e.pointerId)
    },
    [asideWidth],
  )

  const onGutterPointerMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current || !gridRef.current) return
    const containerWidth = gridRef.current.getBoundingClientRect().width
    const delta = dragRef.current.startX - e.clientX
    const next = clampPanelWidth(dragRef.current.startWidth + delta, containerWidth)
    setAsideWidth(next)
  }, [])

  const endDrag = useCallback((e: PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    dragRef.current = null
    setIsResizing(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    setAsideWidth((w) => {
      persistAsideWidth(w)
      return w
    })
  }, [])

  useEffect(() => {
    if (!isResizing) return
    document.body.classList.add('setupSplitResizing')
    return () => document.body.classList.remove('setupSplitResizing')
  }, [isResizing])

  useEffect(() => {
    const grid = gridRef.current
    if (!grid || typeof ResizeObserver === 'undefined') return

    const onResize = () => {
      const containerWidth = grid.clientWidth
      setAsideBounds(getPanelBounds(containerWidth))
      if (dragRef.current) return
      setAsideWidth((w) => {
        const clamped = clampPanelWidth(w, containerWidth)
        if (clamped !== w) persistAsideWidth(clamped)
        return clamped
      })
    }

    onResize()
    const ro = new ResizeObserver(onResize)
    ro.observe(grid)
    return () => ro.disconnect()
  }, [])

  return {
    gridRef,
    asideWidth,
    minAsideWidth: asideBounds.min,
    maxAsideWidth: asideBounds.max,
    gutterSize: GUTTER_SIZE,
    isResizing,
    gridStyle: {
      gridTemplateColumns: `minmax(0, 1fr) ${GUTTER_SIZE}px ${asideWidth}px`,
    } as CSSProperties,
    gutterProps: {
      onPointerDown: onGutterPointerDown,
      onPointerMove: onGutterPointerMove,
      onPointerUp: endDrag,
      onPointerCancel: endDrag,
    },
  }
}
