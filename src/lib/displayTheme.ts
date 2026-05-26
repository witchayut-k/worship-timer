import type { EventDisplaySettings } from '../domain/types'

export type StageThemeVariant = 'normal' | 'warning' | 'over' | 'overFlash'

export type StageTheme = {
  variant: StageThemeVariant
  flash: boolean
  accent: string
  glow: string
  muted: string
  secondary: string
  secondaryGlow: string
}

const STAGE_COLORS: Record<
  StageThemeVariant,
  Pick<StageTheme, 'accent' | 'glow' | 'muted' | 'secondary' | 'secondaryGlow'>
> = {
  normal: {
    accent: '#2ee6d6',
    glow: 'rgba(46, 230, 214, 0.55)',
    muted: 'rgba(46, 230, 214, 0.75)',
    secondary: '#f0a030',
    secondaryGlow: 'rgba(240, 160, 48, 0.5)',
  },
  warning: {
    accent: '#f5a623',
    glow: 'rgba(245, 166, 35, 0.55)',
    muted: 'rgba(245, 166, 35, 0.85)',
    secondary: '#ffd080',
    secondaryGlow: 'rgba(255, 208, 128, 0.45)',
  },
  over: {
    accent: '#ff4d3d',
    glow: 'rgba(255, 77, 61, 0.55)',
    muted: 'rgba(255, 120, 90, 0.85)',
    secondary: '#ff9070',
    secondaryGlow: 'rgba(255, 144, 112, 0.45)',
  },
  overFlash: {
    accent: '#ff4d3d',
    glow: 'rgba(255, 77, 61, 0.75)',
    muted: 'rgba(255, 120, 90, 0.85)',
    secondary: '#ff9070',
    secondaryGlow: 'rgba(255, 144, 112, 0.45)',
  },
}

export function getStageTheme(params: {
  remainingSec: number
  settings: EventDisplaySettings
  manualFlash?: boolean
}): StageTheme {
  const { remainingSec, settings, manualFlash = false } = params

  let variant: StageThemeVariant = 'normal'
  let flash = manualFlash

  if (remainingSec < 0) {
    variant = settings.overtimeFlash ? 'overFlash' : 'over'
    flash = flash || settings.overtimeFlash
  } else if (settings.warningAtOneMinute && remainingSec > 0 && remainingSec <= 60) {
    variant = 'warning'
  }

  const colors = STAGE_COLORS[variant]
  return { variant, flash, ...colors }
}

export function getTimerThemeClasses(params: {
  remainingSec: number
  settings: EventDisplaySettings
  manualFlash?: boolean
}): string {
  const theme = getStageTheme(params)
  if (theme.variant === 'overFlash') return 'timerOver timerFlash'
  if (theme.variant === 'over') return theme.flash ? 'timerOver timerFlash' : 'timerOver'
  if (theme.variant === 'warning') return theme.flash ? 'timerWarning timerFlash' : 'timerWarning'
  return theme.flash ? 'timerNormal timerFlash' : 'timerNormal'
}
