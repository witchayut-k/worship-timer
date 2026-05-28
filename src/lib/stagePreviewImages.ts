import type { StageDisplayTemplate } from '../domain/types'

const STAGE_PREVIEW_IMAGES: Record<StageDisplayTemplate, string> = {
  circle: '/images/ring.png',
  minimal: '/images/mini.png',
  bar: '/images/bar.png',
}

export function getStagePreviewImageSrc(template: StageDisplayTemplate): string {
  return STAGE_PREVIEW_IMAGES[template]
}
