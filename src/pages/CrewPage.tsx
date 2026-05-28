import { useParams } from 'react-router-dom'
import { CrewNowCard } from '../components/CrewNowCard'
import { FullScreenLoading } from '../components/FullScreenLoading'
import { ProgramSchedulePanel } from '../components/ProgramSchedulePanel'
import { useEventLiveSync } from '../hooks/useEventLiveSync'
import { useLocale } from '../i18n/useLocale'
import { hasFirebaseConfig } from '../lib/firebase'

export function CrewPage() {
  const { eventId = '' } = useParams()
  return <CrewPageInner key={eventId} eventId={eventId} />
}

function CrewPageInner({ eventId }: { eventId: string }) {
  const { t } = useLocale()
  const {
    eventMeta,
    items,
    currentIndex,
    phase,
    remainingSec,
    isCloud,
    isLocal,
    cloudReady,
    syncReady,
    displayTitle,
    current,
    next,
  } = useEventLiveSync(eventId)

  if (isCloud && cloudReady && !syncReady) {
    return <FullScreenLoading message={t('common.loading')} />
  }

  return (
    <div className="crewView">
      <header className="crewHeader">
        <h1 className="crewPageTitle">{displayTitle}</h1>
        <p className="crewPageSubtitle muted">{t('crew.pageSubtitle')}</p>
      </header>

      {current ? (
        <>
          <CrewNowCard
            current={current}
            next={next}
            phase={phase}
            remainingSec={remainingSec}
          />
          <div className="crewScheduleWrap">
            <ProgramSchedulePanel
              eventId={eventId}
              items={items}
              currentIndex={currentIndex}
              phase={phase}
              displayRemainingSec={remainingSec}
              eventDate={eventMeta?.date}
              plannedStartTime={eventMeta?.plannedStartTime}
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

      <footer className="crewFooter muted">
        {isLocal ? t('viewer.localSyncHint') : t('viewer.cloudSyncHint')}
        {isCloud && !hasFirebaseConfig() ? ` · ${t('viewer.firebaseRequired')}` : ''}
      </footer>
    </div>
  )
}
