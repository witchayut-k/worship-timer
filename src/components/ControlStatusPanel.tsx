import { useMemo } from 'react'
import type { ProgramItem } from '../domain/types'
import {
  computeCueFinishMs,
  computeServiceOverUnderSec,
  formatWallClock,
  parsePlannedStartMs,
} from '../domain/schedule'
import { formatSignedMMSS } from '../domain/time'
import { useLocale } from '../i18n/useLocale'

type Props = {
  nowMs: number
  eventDate?: string
  plannedStartTime?: string
  items: ProgramItem[]
  currentIndex: number
  remainingSec: number
}

export function ControlStatusPanel({
  nowMs,
  eventDate,
  plannedStartTime,
  items,
  currentIndex,
  remainingSec,
}: Props) {
  const { t } = useLocale()

  const scheduleMeta = useMemo(() => {
    if (!eventDate?.trim() || !plannedStartTime?.trim()) return null
    const plannedStartMs = parsePlannedStartMs(eventDate, plannedStartTime, nowMs)
    if (plannedStartMs == null) return null

    const cueFinishMs = computeCueFinishMs(nowMs, remainingSec)
    const overUnderSec = computeServiceOverUnderSec({
      plannedStartMs,
      items,
      currentIndex,
      remainingSec,
      nowMs,
    })

    return {
      cueFinishText: formatWallClock(cueFinishMs),
      overUnderText: formatSignedMMSS(overUnderSec),
      overUnderLate: overUnderSec > 0,
    }
  }, [eventDate, plannedStartTime, nowMs, remainingSec, items, currentIndex])

  return (
    <section className="controlStatusPanel" aria-label={t('control.timeStatus')}>
      {scheduleMeta ? (
        <div className="controlStatusGrid">
          <div className="controlStatusItem">
            <span className="controlStatusLabel">{t('control.cueFinish')}</span>
            <span className="controlStatusValue timeMono">{scheduleMeta.cueFinishText}</span>
          </div>
          <div className="controlStatusItem">
            <span className="controlStatusLabel">{t('control.overUnder')}</span>
            <span
              className={`controlStatusValue timeMono ${scheduleMeta.overUnderLate ? 'controlStatusLate' : 'controlStatusEarly'}`}
            >
              {scheduleMeta.overUnderText}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  )
}
