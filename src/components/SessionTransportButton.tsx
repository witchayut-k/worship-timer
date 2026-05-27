import { useState } from 'react'
import type { RuntimePhase } from '../domain/types'
import { useActiveControl } from '../hooks/useActiveControl'
import { useLocale } from '../i18n/useLocale'
import { pauseRuntimeIfRunning, startRuntime } from '../lib/runtimeTransport'
import { PauseIcon, PlayIcon } from './TransportIcons'

type SessionTransportButtonProps = {
  eventId: string
  eventTitle?: string
  phase: RuntimePhase | null
}

export function SessionTransportButton({
  eventId,
  eventTitle,
  phase,
}: SessionTransportButtonProps) {
  const { t } = useLocale()
  const { setActiveControl } = useActiveControl()
  const [busy, setBusy] = useState(false)

  const isRunning = phase === 'running'

  const onClick = () => {
    if (busy) return
    setBusy(true)
    void (async () => {
      try {
        if (isRunning) {
          await pauseRuntimeIfRunning(eventId)
        } else {
          await startRuntime(eventId)
          const title = eventTitle?.trim() || t('event.untitled')
          setActiveControl(eventId, title)
        }
      } finally {
        setBusy(false)
      }
    })()
  }

  return (
    <button
      type="button"
      className={`btnHeaderTransport btnWithIcon${isRunning ? ' btnHeaderTransportPause' : ' btnHeaderTransportStart'}`}
      disabled={busy}
      onClick={onClick}
      aria-label={isRunning ? t('control.pause') : t('control.start')}
    >
      {isRunning ? <PauseIcon /> : <PlayIcon />}
      <span>{isRunning ? t('control.pause') : t('control.start')}</span>
    </button>
  )
}
