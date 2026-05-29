import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { CrewDoneCard } from '../components/CrewDoneCard'
import { CrewNowCard } from '../components/CrewNowCard'
import { CrewUpcomingGrid } from '../components/CrewUpcomingGrid'
import { FullScreenLoading } from '../components/FullScreenLoading'
import { ProgramSchedulePanel } from '../components/ProgramSchedulePanel'
import { resolveEventSettings } from '../domain/types'
import { formatServiceDateLabel } from '../domain/serviceList'
import { getStageTheme } from '../lib/displayTheme'
import { useEventLiveSync } from '../hooks/useEventLiveSync'
import { useLocale } from '../i18n/useLocale'

export function CrewPage() {
  const { eventId = '' } = useParams()
  return <CrewPageInner key={eventId} eventId={eventId} />
}

function CrewPageInner({ eventId }: { eventId: string }) {
  const { t, locale } = useLocale()
  const {
    eventMeta,
    items,
    currentIndex,
    phase,
    remainingSec,
    isCloud,
    cloudReady,
    syncReady,
    displayTitle,
    current,
  } = useEventLiveSync(eventId)

  const settings = resolveEventSettings(eventMeta)
  const liveDotTheme = useMemo(
    () => getStageTheme({ remainingSec, settings }),
    [remainingSec, settings],
  )

  const pageSubtitle = useMemo(() => {
    const dateStr = eventMeta?.date?.trim()
    const timeStr = eventMeta?.plannedStartTime?.trim()
    const parts: string[] = []
    if (dateStr) parts.push(formatServiceDateLabel(dateStr, locale))
    if (timeStr) parts.push(timeStr)
    return parts.length > 0 ? parts.join(' · ') : null
  }, [eventMeta?.date, eventMeta?.plannedStartTime, locale])

  if (isCloud && cloudReady && !syncReady) {
    return <FullScreenLoading message={t('common.loading')} />
  }

  return (
    <div className="crewView">
      <header className="crewHeader">
        <h1 className="crewPageTitle">{displayTitle}</h1>
        {pageSubtitle ? <p className="crewPageSubtitle muted">{pageSubtitle}</p> : null}
      </header>

      {current ? (
        <>
          {currentIndex > 0 ? <CrewDoneCard item={items[currentIndex - 1]} /> : null}
          <CrewNowCard
            current={current}
            phase={phase}
            remainingSec={remainingSec}
            durationSec={current.durationSec}
          />
          <CrewUpcomingGrid items={items} currentIndex={currentIndex} />
          <div className="crewScheduleWrap">
            <ProgramSchedulePanel
              eventId={eventId}
              items={items}
              currentIndex={currentIndex}
              phase={phase}
              displayRemainingSec={remainingSec}
              eventDate={eventMeta?.date}
              plannedStartTime={eventMeta?.plannedStartTime}
              liveDotTheme={liveDotTheme}
              readOnly
              showCrewNotes
              scrollActiveIntoView
              className="programScheduleCrew"
              listClassName="programScheduleListCrew"
            />
          </div>
        </>
      ) : (
        <div className="crewEmpty stageEmpty muted">{t('viewer.noProgram')}</div>
      )}
    </div>
  )
}
