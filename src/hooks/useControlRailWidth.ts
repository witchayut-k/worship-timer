import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from 'react'
import {
  clampPanelWidth,
  DEFAULT_PANEL_WIDTH,
  getPanelBounds,
  MAX_PANEL_RATIO,
  MIN_PANEL_RATIO,
} from '../lib/resizablePanelBounds'

export const CONTROL_RAIL_WIDTH_STORAGE_KEY = 'worship-timer:control-rail-width'

export const DEFAULT_RAIL_WIDTH = DEFAULT_PANEL_WIDTH
export const MIN_RAIL_RATIO = MIN_PANEL_RATIO
export const MAX_RAIL_RATIO = MAX_PANEL_RATIO
export const getRailBounds = getPanelBounds
export const clampRailWidth = clampPanelWidth

function readStoredRailWidth(): number {
  try {
    const raw = localStorage.getItem(CONTROL_RAIL_WIDTH_STORAGE_KEY)
    if (!raw) return DEFAULT_RAIL_WIDTH
    const n = Number.parseInt(raw, 10)
    if (!Number.isFinite(n)) return DEFAULT_RAIL_WIDTH
    return n
  } catch {
    return DEFAULT_RAIL_WIDTH
  }
}

function persistRailWidth(width: number) {
  try {
    localStorage.setItem(CONTROL_RAIL_WIDTH_STORAGE_KEY, String(width))
  } catch {
    // ignore
  }
}

export function useControlRailWidth(workspaceRef: RefObject<HTMLElement | null>) {
  const [railWidth, setRailWidth] = useState(readStoredRailWidth)
  const [railBounds, setRailBounds] = useState(() => getPanelBounds(undefined))
  const draggingRef = useRef(false)

  const setWidthClamped = useCallback(
    (next: number) => {
      const workspaceWidth = workspaceRef.current?.clientWidth
      const clamped = clampPanelWidth(next, workspaceWidth)
      setRailWidth(clamped)
      persistRailWidth(clamped)
      return clamped
    },
    [workspaceRef],
  )

  useEffect(() => {
    const el = workspaceRef.current
    if (!el) return

    const onResize = () => {
      const w = el.clientWidth
      setRailBounds(getPanelBounds(w))
      if (draggingRef.current) return
      setRailWidth((prev) => {
        const clamped = clampPanelWidth(prev, w)
        if (clamped !== prev) persistRailWidth(clamped)
        return clamped
      })
    }

    onResize()
    const ro = new ResizeObserver(onResize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [workspaceRef])

  const onResizerPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return
      e.preventDefault()
      const workspace = workspaceRef.current
      if (!workspace) return

      const resizer = e.currentTarget
      draggingRef.current = true
      resizer.setPointerCapture(e.pointerId)
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      const onMove = (ev: PointerEvent) => {
        const rect = workspace.getBoundingClientRect()
        const next = rect.right - ev.clientX
        setWidthClamped(next)
      }

      const onUp = (ev: PointerEvent) => {
        draggingRef.current = false
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
        try {
          resizer.releasePointerCapture(ev.pointerId)
        } catch {
          // ignore
        }
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerup', onUp)
        document.removeEventListener('pointercancel', onUp)
      }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerup', onUp)
      document.addEventListener('pointercancel', onUp)
    },
    [setWidthClamped, workspaceRef],
  )

  return {
    railWidth,
    minRailWidth: railBounds.min,
    maxRailWidth: railBounds.max,
    onResizerPointerDown,
  }
}
