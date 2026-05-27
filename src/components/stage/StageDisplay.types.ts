import type { StageDisplayTemplate } from '../../domain/types'
import type { StageTheme } from '../../lib/displayTheme'

export type StageDisplayContentProps = {
  remainingSec: number
  durationSec: number
  currentName: string
  currentLeader: string
  nextName: string | null
  nextLeader: string | null
  theme: StageTheme
  paused?: boolean
}

export type StageDisplayProps = StageDisplayContentProps & {
  template: StageDisplayTemplate
}
