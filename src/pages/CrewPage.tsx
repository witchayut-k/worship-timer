import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { CrewDoneCard } from '../components/CrewDoneCard'
import { CrewLiveMessageBanner } from '../components/CrewLiveMessageBanner'
import { CrewNowCard } from '../components/CrewNowCard'
import { CrewUpcomingGrid } from '../components/CrewUpcomingGrid'
import { FullScreenLoading } from '../components/FullScreenLoading'
import { appConfig } from '../config/app.config'
import { useMinDurationLoading } from '../hooks/useMinDurationLoading'
import { ProgramSchedulePanel } from '../components/ProgramSchedulePanel'
import { resolveEventSettings } from '../domain/types'
import { formatServiceDateLabel } from '../domain/serviceList'
import { getStageTheme } from '../lib/displayTheme'
import { useEventLiveSync } from '../hooks/useEventLiveSync'
import { LanguageToggle } from '../components/LanguageToggle'
import { ScheduleViewSettingsButton } from '../components/ScheduleViewSettingsButton'
import { useScheduleViewPrefs } from '../hooks/useScheduleViewPrefs'
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
    serviceEnded,
    activeMessage,
  } = useEventLiveSync(eventId)

  const settings = resolveEventSettings(eventMeta)
  const { prefs } = useScheduleViewPrefs()
  const timelineAvailable = Boolean(
    eventMeta?.date?.trim() && eventMeta?.plannedStartTime?.trim(),
  )
  const liveDotTheme = useMemo(
    () => (serviceEnded ? null : getStageTheme({ remainingSec, settings })),
    [remainingSec, settings, serviceEnded],
  )

  const pageSubtitle = useMemo(() => {
    const dateStr = eventMeta?.date?.trim()
    const timeStr = eventMeta?.plannedStartTime?.trim()
    const parts: string[] = []
    if (dateStr) parts.push(formatServiceDateLabel(dateStr, locale))
    if (timeStr) parts.push(timeStr)
    return parts.length > 0 ? parts.join(' · ') : null
  }, [eventMeta?.date, eventMeta?.plannedStartTime, locale])

  const cloudBootLoading = isCloud && cloudReady && !syncReady
  const showLoadingGate = useMinDurationLoading(
    cloudBootLoading,
    appConfig.fullScreenLoadingMinMs,
  )

  if (showLoadingGate) {
    return <FullScreenLoading message={t('common.loading')} />
  }

  return (
    <div className="crewView">
      <header className="crewHeader">
        <div className="crewHeaderMain">
          <div className="crewBrand" aria-label={t('app.name')}>
            <img className="appBrandLogo" src="/logo.png" alt="" width={458} height={70} />
          </div>
          <h1 className="crewPageTitle">{displayTitle}</h1>
          {pageSubtitle ? <p className="crewPageSubtitle muted">{pageSubtitle}</p> : null}
        </div>
        <div className="crewHeaderActions">
          <ScheduleViewSettingsButton variant="crew" timelineAvailable={timelineAvailable} />
          <LanguageToggle />
        </div>
      </header>

      {current ? (
        <>
          {serviceEnded ? (
            <div className="crewServiceEndedBanner" role="status">
              {t('crew.serviceEnded')}
            </div>
          ) : null}
          {appConfig.liveMessageEnabled && activeMessage ? (
            <CrewLiveMessageBanner message={activeMessage} />
          ) : null}
          {currentIndex > 0 ? <CrewDoneCard item={items[currentIndex - 1]} /> : null}
          <CrewNowCard
            current={current}
            phase={phase}
            remainingSec={remainingSec}
            durationSec={current.durationSec}
            serviceEnded={serviceEnded}
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
              serviceEnded={serviceEnded}
              readOnly
              showCrewNotes
              scrollActiveIntoView={prefs.scrollActiveIntoView}
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
