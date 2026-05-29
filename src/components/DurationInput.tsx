import { useState } from 'react'
import { formatSecToMmSs, parseMmSsToSec } from '../domain/time'
import { useLocale } from '../i18n/useLocale'

type Props = {
  valueSec: number
  onChangeSec: (sec: number) => void
  label?: string
}

export function DurationInput({ valueSec, onChangeSec, label }: Props) {
  const { t } = useLocale()
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState(() => formatSecToMmSs(valueSec))

  const shown = focused ? draft : formatSecToMmSs(valueSec)
  const ariaLabel = label ?? t('duration.aria')

  const commit = () => {
    const parsed = parseMmSsToSec(draft)
    if (parsed != null) {
      onChangeSec(parsed)
      setDraft(formatSecToMmSs(parsed))
      return
    }
    setDraft(formatSecToMmSs(valueSec))
  }

  return (
    <label className="field">
      {label ? <div className="label">{label}</div> : null}
      <input
        value={shown}
        placeholder={t('duration.placeholder')}
        inputMode="numeric"
        aria-label={ariaLabel}
        onFocus={() => {
          setFocused(true)
          setDraft(formatSecToMmSs(valueSec))
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setFocused(false)
          commit()
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            ;(e.target as HTMLInputElement).blur()
          }
        }}
      />
    </label>
  )
}
