import type { CSSProperties } from 'react'
import type { StageTheme } from './displayTheme'

export function getStageRootClass(theme: StageTheme, paused: boolean, templateClass: string): string {
  return `stageDisplay ${templateClass} stageTheme-${theme.variant}${theme.flash ? ' stageFlash' : ''}${paused ? ' stagePaused' : ''}`
}

export function getStageThemeStyle(theme: StageTheme): CSSProperties & Record<string, string> {
  return {
    '--stage-accent': theme.accent,
    '--stage-glow': theme.glow,
    '--stage-muted': theme.muted,
    '--stage-secondary': theme.secondary,
    '--stage-secondary-glow': theme.secondaryGlow,
  }
}

export function getCenterLabel(paused: boolean, isOvertime: boolean): string {
  if (paused) return 'PAUSED'
  if (isOvertime) return 'OVERTIME'
  return 'REMAINING'
}

export function getTimerAriaLabel(paused: boolean, isOvertime: boolean, timeText: string): string {
  if (paused) return `timer paused, ${timeText}`
  if (isOvertime) return `overtime, ${timeText}`
  return 'timer'
}
