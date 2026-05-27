export const DEFAULT_PANEL_WIDTH = 400
export const MIN_PANEL_RATIO = 0.2
export const MAX_PANEL_RATIO = 0.6

export function getPanelBounds(workspaceWidth?: number): { min: number; max: number } {
  if (workspaceWidth == null || workspaceWidth <= 0) {
    return {
      min: Math.round(DEFAULT_PANEL_WIDTH * MIN_PANEL_RATIO),
      max: Math.round(DEFAULT_PANEL_WIDTH * MAX_PANEL_RATIO),
    }
  }
  let min = Math.round(workspaceWidth * MIN_PANEL_RATIO)
  let max = Math.round(workspaceWidth * MAX_PANEL_RATIO)
  if (max < min) max = min
  return { min, max }
}

export function clampPanelWidth(width: number, workspaceWidth?: number): number {
  if (workspaceWidth == null || workspaceWidth <= 0) {
    return Math.round(width)
  }
  const { min, max } = getPanelBounds(workspaceWidth)
  return Math.round(Math.min(max, Math.max(min, width)))
}
