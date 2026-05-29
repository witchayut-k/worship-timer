import type { LiveMessage } from '../domain/types'
import { formatLiveMessageSentTime } from '../lib/formatLiveMessageTime'
import { useLocale } from '../i18n/useLocale'

type Props = {
  message: LiveMessage
}

export function CrewLiveMessageBanner({ message }: Props) {
  const { t, locale } = useLocale()

  return (
    <div className="crewLiveMessage" role="status" aria-live="polite">
      <p className="crewLiveMessageText">{message.text}</p>
      <span className="crewLiveMessageTime muted">
        {t('control.liveMessageSent', {
          time: formatLiveMessageSentTime(message.sentAtMs, locale),
        })}
      </span>
    </div>
  )
}
