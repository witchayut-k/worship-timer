import type { RuntimePhase } from '../domain/types'
import { useLocale } from '../i18n/useLocale'
import { PauseIcon, PlayIcon } from './TransportIcons'

type Props = {
  phase: RuntimePhase
  currentIndex: number
  itemCount: number
  onPrev: () => void
  onStart: () => void
  onPause: () => void
  onNext: () => void
}

export function ControlTransportDock({
  phase,
  currentIndex,
  itemCount,
  onPrev,
  onStart,
  onPause,
  onNext,
}: Props) {
  const { t } = useLocale()

  return (
    <div className="controlTransportDock" role="group" aria-label={t('control.transport')}>
      <div className="controlTransportDockMainRow">
        <div className="controlTransportDockButtons controls controlsTransport">
          <button
            className="btnGhost"
            type="button"
            onClick={onPrev}
            disabled={currentIndex === 0}
          >
            ◀ {t('control.prev')}
          </button>

          {phase !== 'running' ? (
            <button className="btnTransportPrimary btnTransportStart" type="button" onClick={onStart}>
              <PlayIcon />
              {t('control.start')}
            </button>
          ) : (
            <button className="btnTransportPrimary btnTransportPause" type="button" onClick={onPause}>
              <PauseIcon />
              {t('control.pause')}
            </button>
          )}

          <button
            className="btnGhost"
            type="button"
            onClick={onNext}
            disabled={currentIndex + 1 >= itemCount}
          >
            {t('control.next')} ▶
          </button>
        </div>
      </div>
    </div>
  )
}
