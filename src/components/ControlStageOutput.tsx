import { useLocale } from '../i18n/useLocale'

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
  const { t } = useLocale()

  return (
    <section className="controlStageOutput" aria-label={t('control.stageControl')}>
      <span className="controlStageOutputLabel">{t('control.stageLabel')}</span>
      <div className="controlStageOutputActions">
        <button
          className={`btnGhost ${blackout ? 'controlStageOutputActive' : ''}`}
          type="button"
          aria-pressed={blackout}
          onClick={() => onBlackoutChange(!blackout)}
        >
          {t('control.blackout')}
        </button>
        <button
          className={`btnGhost ${manualFlashActive ? 'controlFlashBtnActive' : ''}`}
          type="button"
          aria-pressed={manualFlashActive}
          onClick={onFlashTrigger}
        >
          {t('control.flash')}
        </button>
      </div>
    </section>
  )
}
