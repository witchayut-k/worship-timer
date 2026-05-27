import type { CSSProperties } from 'react'

/** Viewport short-side (px) where `targetPx` is the intended size before min/max clamping. */
const DEFAULT_REFERENCE_SHORT_SIDE_PX = 1080

export const stageDisplayConfig = {
  layoutPx: 600,
  ring: {
    radius: 290,
    stroke: 12,
    glowStroke: 0,
    frameOffset: 3,
    frameStroke: 1.5,
    glowBlur: 6,
    contentPadding: 4,
  },
  display: {
    maxVmin: 98,
    maxDvh: 98,
    maxPx: 1100,
    centerPaddingX: '5%',
    glowInset: '3%',
    centerMaxWidth: '92%',
  },
  /** Global knobs for responsiveClamp(); typography values are target px at reference viewport. */
  clamp: {
    referenceShortSidePx: DEFAULT_REFERENCE_SHORT_SIDE_PX,
    fontMinRatio: 0.73,
    fontMaxRatio: 1,
    timerMinRatio: 0.5,
    spacingMinRatio: 0.5,
    spacingMaxRatio: 1,
  },
  typography: {
    segmentKicker: 20,
    segmentName: 24,
    segmentLeader: 24,
    remainingLabel: 36,
    timer: 340,
    timerWeight: 900,
    remainingMarginTop: 100,
  },
} as const

export type StageTypographyConfig = {
  segmentKicker: number
  segmentName: number
  segmentLeader: number
  remainingLabel: number
  timer: number
  timerWeight: number
  remainingMarginTop: number
}

export type StageDisplaySizingConfig = {
  maxVmin: number
  maxDvh: number
  maxPx: number
  centerPaddingX: string
  glowInset: string
  centerMaxWidth: string
}

export type StageDisplayConfig = {
  layoutPx: number
  ring: typeof stageDisplayConfig.ring
  display: StageDisplaySizingConfig
  clamp: {
    referenceShortSidePx: number
    fontMinRatio: number
    fontMaxRatio: number
    timerMinRatio: number
    spacingMinRatio: number
    spacingMaxRatio: number
  }
  typography: StageTypographyConfig
}

export const STAGE_LAYOUT_PX = stageDisplayConfig.layoutPx

type ClampRatios = {
  minRatio: number
  maxRatio: number
}

/**
 * Build `clamp(min, vmin, max)` from one target px at the reference viewport.
 * vmin scales with viewport; min/max ratios cap extremes on small/large screens.
 */
export function responsiveClamp(
  targetPx: number,
  referenceShortSidePx: number,
  { minRatio, maxRatio }: ClampRatios,
): string {
  const vmin = (targetPx / referenceShortSidePx) * 100
  const min = Math.round(targetPx * minRatio)
  const max = Math.round(targetPx * maxRatio)
  return `clamp(${min}px, ${vmin.toFixed(2)}vmin, ${max}px)`
}

export type StageLayoutMetrics = {
  layoutPx: number
  center: number
  ringRadius: number
  ringStroke: number
  ringGlowStroke: number
  frameRadius: number
  frameStroke: number
  glowBlur: number
  ringInsetPercent: number
  display: StageDisplayConfig['display']
  clamp: StageDisplayConfig['clamp']
  typography: StageDisplayConfig['typography']
}

export function getStageLayoutMetrics(cfg: StageDisplayConfig = stageDisplayConfig): StageLayoutMetrics {
  const center = cfg.layoutPx / 2
  const ringInsetPercent =
    ((center - cfg.ring.radius + cfg.ring.stroke / 2 + cfg.ring.contentPadding) / center) * 100

  return {
    layoutPx: cfg.layoutPx,
    center,
    ringRadius: cfg.ring.radius,
    ringStroke: cfg.ring.stroke,
    ringGlowStroke: cfg.ring.glowStroke,
    frameRadius: cfg.ring.radius + cfg.ring.frameOffset,
    frameStroke: cfg.ring.frameStroke,
    glowBlur: cfg.ring.glowBlur,
    ringInsetPercent,
    display: cfg.display,
    clamp: cfg.clamp,
    typography: cfg.typography,
  }
}

export function getStageCssVars(metrics: StageLayoutMetrics): CSSProperties & Record<string, string> {
  const { display: d, typography: t, clamp: c } = metrics
  const ref = c.referenceShortSidePx
  const font = (targetPx: number, minRatio: number = c.fontMinRatio) =>
    responsiveClamp(targetPx, ref, { minRatio, maxRatio: c.fontMaxRatio })
  const space = (targetPx: number) =>
    responsiveClamp(targetPx, ref, { minRatio: c.spacingMinRatio, maxRatio: c.spacingMaxRatio })

  return {
    '--stage-ring-inset': `${metrics.ringInsetPercent}%`,
    '--stage-display-width': `min(${d.maxVmin}vmin, min(${d.maxDvh}dvh, ${d.maxPx}px))`,
    '--stage-center-padding-x': d.centerPaddingX,
    '--stage-glow-inset': d.glowInset,
    '--stage-center-max-width': d.centerMaxWidth,
    '--stage-segment-kicker-font-size': font(t.segmentKicker),
    '--stage-segment-name-font-size': font(t.segmentName),
    '--stage-segment-leader-font-size': font(t.segmentLeader),
    '--stage-remaining-label-font-size': font(t.remainingLabel),
    '--stage-remaining-label-margin-top': space(t.remainingMarginTop),
    '--stage-timer-font-size': font(t.timer, c.timerMinRatio),
    '--stage-timer-font-weight': String(t.timerWeight),
  }
}
