import type { StageDisplayProps } from './stage/StageDisplay.types'
import { StageBarDisplay } from './stage/StageBarDisplay'
import { StageCircleDisplay } from './StageCircleDisplay'
import { StageMinimalDisplay } from './stage/StageMinimalDisplay'

export type { StageDisplayContentProps, StageDisplayProps } from './stage/StageDisplay.types'

export function StageDisplay({ template, ...props }: StageDisplayProps) {
  switch (template) {
    case 'minimal':
      return <StageMinimalDisplay {...props} />
    case 'bar':
      return <StageBarDisplay {...props} />
    default:
      return <StageCircleDisplay {...props} />
  }
}
