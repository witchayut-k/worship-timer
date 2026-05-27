import { useEffect, useState } from 'react'
import { formatLocalDateShort, formatWallClock, getTimezoneLabel } from '../domain/schedule'
import { useLocale } from '../i18n/useLocale'

export function AppHeaderClock() {
  const { locale } = useLocale()
  const nowMs = useWallClockMs()
  const clockText = formatWallClock(nowMs)
  const timezoneLabel = getTimezoneLabel()
  const dateLabel = formatLocalDateShort(nowMs, locale)

  return (
    <div className="appHeaderClock" aria-live="off">
      <div className="appHeaderClockTime">{clockText}</div>
      <div className="appHeaderClockMeta">
        <span>{timezoneLabel}</span>
        <span className="controlStatusMetaSep">·</span>
        <span>{dateLabel}</span>
      </div>
    </div>
  )
}

function useWallClockMs(): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return now
}
