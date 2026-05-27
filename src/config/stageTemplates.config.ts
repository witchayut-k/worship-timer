import type { StageDisplayTemplate } from '../domain/types'
import {
  stageDisplayConfig,
  type StageDisplayConfig,
  type StageDisplaySizingConfig,
  type StageTypographyConfig,
} from './stageDisplay.config'

export type StageTemplateLayout = {
  layoutWidth: number
  layoutHeight: number
  displayConfig: StageDisplayConfig['display']
  typography: StageDisplayConfig['typography']
  clamp: StageDisplayConfig['clamp']
}

const sharedDisplay = stageDisplayConfig.display
const sharedClamp = stageDisplayConfig.clamp

const circleTypography = stageDisplayConfig.typography

const minimalTypography: StageTypographyConfig = {
  ...circleTypography,
  segmentKicker: 18,
  segmentName: 22,
  segmentLeader: 20,
  remainingLabel: 28,
  timer: 380,
  remainingMarginTop: 24,
}

const barTypography: StageTypographyConfig = {
  ...circleTypography,
  segmentKicker: 16,
  segmentName: 28,
  segmentLeader: 22,
  remainingLabel: 24,
  timer: 200,
  remainingMarginTop: 8,
}

const STAGE_TEMPLATE_LAYOUTS: Record<StageDisplayTemplate, StageTemplateLayout> = {
  circle: {
    layoutWidth: stageDisplayConfig.layoutPx,
    layoutHeight: stageDisplayConfig.layoutPx,
    displayConfig: sharedDisplay,
    typography: circleTypography,
    clamp: sharedClamp,
  },
  minimal: {
    layoutWidth: 600,
    layoutHeight: 600,
    displayConfig: sharedDisplay,
    typography: minimalTypography,
    clamp: sharedClamp,
  },
  bar: {
    layoutWidth: stageDisplayConfig.layoutPx,
    layoutHeight: stageDisplayConfig.layoutPx,
    displayConfig: {
      ...sharedDisplay,
      maxPx: 1600,
      centerPaddingX: '4%',
      centerMaxWidth: '96%',
    } satisfies StageDisplaySizingConfig,
    typography: barTypography,
    clamp: sharedClamp,
  },
}

export function getStageTemplateConfig(template: StageDisplayTemplate): StageTemplateLayout {
  return STAGE_TEMPLATE_LAYOUTS[template]
}

export function getStageLayoutDimensions(template: StageDisplayTemplate): {
  width: number
  height: number
} {
  const cfg = getStageTemplateConfig(template)
  return { width: cfg.layoutWidth, height: cfg.layoutHeight }
}

export function buildStageDisplayConfig(template: StageDisplayTemplate): StageDisplayConfig {
  const layout = getStageTemplateConfig(template)
  return {
    layoutPx: layout.layoutWidth,
    ring: stageDisplayConfig.ring,
    display: layout.displayConfig,
    clamp: layout.clamp,
    typography: layout.typography,
  }
}
