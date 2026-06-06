import { BlackoutIcon, FlashIcon } from './StageControlIcons'
import { useLocale } from '../i18n/useLocale'

type Props = {
  blackout: boolean
  manualFlashActive: boolean
  disabled?: boolean
  onBlackoutChange: (enabled: boolean) => void
  onFlashTrigger: () => void
}

export function ControlStageOutput({
  blackout,
  manualFlashActive,
  disabled = false,
  onBlackoutChange,
  onFlashTrigger,
}: Props) {
  const { t } = useLocale()

  return (
    <>
      <button
        className={`btnGhost controlTopActionBtn ${blackout ? 'controlBlackoutBtnActive' : ''}`}
        type="button"
        aria-pressed={blackout}
        disabled={disabled}
        onClick={() => onBlackoutChange(!blackout)}
      >
        <BlackoutIcon />
        {t('control.blackout')}
      </button>
      <button
        className={`btnGhost controlTopActionBtn ${manualFlashActive ? 'controlFlashBtnActive' : ''}`}
        type="button"
        aria-pressed={manualFlashActive}
        disabled={disabled}
        onClick={onFlashTrigger}
      >
        <FlashIcon />
        {t('control.flash')}
      </button>
    </>
  )
}
