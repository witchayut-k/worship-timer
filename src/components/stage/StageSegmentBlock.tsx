import type { SegmentLines } from '../../lib/stageSegmentLines'

export function StageSegmentBlock({
  lines,
  variant,
}: {
  lines: SegmentLines
  variant: 'current' | 'next'
}) {
  const rootClass =
    variant === 'current'
      ? 'stageSegmentInside stageSegmentInsideCurrent'
      : 'stageSegmentInside stageSegmentInsideNext'
  return (
    <div className={rootClass}>
      <div className="stageSegmentKicker">{lines.kicker}</div>
      <div className="stageSegmentName">{lines.segment}</div>
      {lines.leader ? <div className="stageSegmentLeader">{lines.leader}</div> : null}
    </div>
  )
}
