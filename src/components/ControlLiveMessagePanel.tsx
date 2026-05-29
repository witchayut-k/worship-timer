import { useState, type FormEvent } from 'react'
import type { LiveMessage } from '../domain/types'
import { formatLiveMessageSentTime } from '../lib/formatLiveMessageTime'
import { useLocale } from '../i18n/useLocale'

const MAX_LENGTH = 120

type Props = {
  activeMessage: LiveMessage | null
  onSend: (text: string) => void
  onClear: () => void
  disabled?: boolean
}

export function ControlLiveMessagePanel({
  activeMessage,
  onSend,
  onClear,
  disabled = false,
}: Props) {
  const { t, locale } = useLocale()
  const [draft, setDraft] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || disabled) return
    onSend(text)
    setDraft('')
  }

  return (
    <section className="controlLiveMessagePanel" aria-label={t('control.liveMessage')}>
      <h2 className="controlLiveMessageTitle">{t('control.liveMessage')}</h2>
      <form className="controlLiveMessageForm" onSubmit={handleSubmit}>
        <input
          className="controlLiveMessageInput"
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('control.liveMessagePlaceholder')}
          maxLength={MAX_LENGTH}
          disabled={disabled}
          aria-label={t('control.liveMessagePlaceholder')}
        />
        <button className="btnPrimary controlLiveMessageSend" type="submit" disabled={disabled || !draft.trim()}>
          {t('control.liveMessageSend')}
        </button>
      </form>

      {activeMessage ? (
        <div className="controlLiveMessageActive">
          <div className="controlLiveMessageActiveBody">
            <span className="controlLiveMessageActiveLabel">{t('control.liveMessageActive')}</span>
            <p className="controlLiveMessageActiveText">{activeMessage.text}</p>
            <span className="controlLiveMessageActiveTime muted">
              {t('control.liveMessageSent', {
                time: formatLiveMessageSentTime(activeMessage.sentAtMs, locale),
              })}
            </span>
          </div>
          <button
            className="btnGhost controlLiveMessageClear"
            type="button"
            onClick={onClear}
            disabled={disabled}
          >
            {t('control.liveMessageClear')}
          </button>
        </div>
      ) : null}
    </section>
  )
}
