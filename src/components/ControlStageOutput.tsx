type Props = {
  blackout: boolean
  manualFlashActive: boolean
  onBlackoutChange: (enabled: boolean) => void
  onFlashTrigger: () => void
}

export function ControlStageOutput({
  blackout,
  manualFlashActive,
  onBlackoutChange,
  onFlashTrigger,
}: Props) {
  return (
    <section className="controlStageOutput" aria-label="ควบคุมจอ Stage">
      <span className="controlStageOutputLabel">จอ Stage</span>
      <div className="controlStageOutputActions">
        <button
          className={`btnGhost ${blackout ? 'controlStageOutputActive' : ''}`}
          type="button"
          aria-pressed={blackout}
          onClick={() => onBlackoutChange(!blackout)}
        >
          Blackout
        </button>
        <button
          className={`btnGhost ${manualFlashActive ? 'controlFlashBtnActive' : ''}`}
          type="button"
          aria-pressed={manualFlashActive}
          onClick={onFlashTrigger}
        >
          Flash
        </button>
      </div>
    </section>
  )
}
