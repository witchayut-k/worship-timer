import type { LiveMessage } from '../domain/types'
import { useLocale } from '../i18n/useLocale'

type Props = {
  message: LiveMessage
}

export function StageLiveMessageBar({ message }: Props) {
  const { t } = useLocale()

  return (
    <div className="stageLiveMessageBar" role="status" aria-live="polite">
      <span className="stageLiveMessageBarLabel">{t('viewer.liveMessageLabel')}</span>
      <span className="stageLiveMessageBarText">{message.text}</span>
    </div>
  )
}
