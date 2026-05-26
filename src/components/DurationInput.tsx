import { useState } from 'react'
import { formatSecToMmSs, parseMmSsToSec } from '../domain/time'

type Props = {
  valueSec: number
  onChangeSec: (sec: number) => void
  label?: string
}

export function DurationInput({ valueSec, onChangeSec, label }: Props) {
  const [focused, setFocused] = useState(false)
  const [draft, setDraft] = useState(() => formatSecToMmSs(valueSec))

  const shown = focused ? draft : formatSecToMmSs(valueSec)

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
        placeholder="05:00"
        inputMode="numeric"
        aria-label={label ?? 'ระยะเวลา'}
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
