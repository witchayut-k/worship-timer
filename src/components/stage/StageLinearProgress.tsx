export function StageLinearProgress({ ratio }: { ratio: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, ratio)) * 100)
  return (
    <div className="stageLinearProgress" aria-hidden>
      <div className="stageLinearProgressTrack">
        <div className="stageLinearProgressFill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
