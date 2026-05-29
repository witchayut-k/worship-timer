import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FullScreenLoading } from '../components/FullScreenLoading'
import { appConfig } from '../config/app.config'
import { useMinDurationLoading } from '../hooks/useMinDurationLoading'
import { SlidersIcon } from '../components/SetupIcons'
import { StageDisplay } from '../components/StageDisplay'
import { StageLiveMessageOverlay } from '../components/StageLiveMessageOverlay'
import { resolveEventSettings } from '../domain/types'
import { isManualFlashActive } from '../domain/stageOutput'
import { useLocale } from '../i18n/useLocale'
import { useEventLiveSync } from '../hooks/useEventLiveSync'
import { getStageTheme } from '../lib/displayTheme'
import { hasFirebaseConfig } from '../lib/firebase'

export function ViewerPage() {
  const { eventId = '' } = useParams()
  return <ViewerPageInner key={eventId} eventId={eventId} />
}

function ViewerPageInner({ eventId }: { eventId: string }) {
  const { t } = useLocale()
  const [searchParams] = useSearchParams()
  const kiosk = searchParams.get('kiosk') === '1'

  const {
    eventMeta,
    phase,
    remainingSec,
    blackout,
    manualFlashUntilMs,
    serviceEnded,
    nowMs,
    isCloud,
    isLocal,
    cloudReady,
    syncReady,
    displayTitle,
    current,
    next,
    activeMessage,
  } = useEventLiveSync(eventId)

  const settings = resolveEventSettings(eventMeta)
  const manualFlashActive = isManualFlashActive(manualFlashUntilMs, nowMs)
  const stageTheme = getStageTheme({ remainingSec, settings, manualFlash: manualFlashActive })

  useEffect(() => {
    if (!kiosk) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        void document.documentElement.requestFullscreen?.()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [kiosk])

  const cloudBootLoading = isCloud && cloudReady && !syncReady
  const showLoadingGate = useMinDurationLoading(
    cloudBootLoading,
    appConfig.fullScreenLoadingMinMs,
  )

  if (showLoadingGate) {
    return <FullScreenLoading message={t('common.loading')} />
  }

  return (
    <div className={`viewer ${kiosk ? 'kiosk' : ''}`}>
      {!kiosk ? (
        <div className="viewerTop">
          <div className="viewerTitle">{displayTitle}</div>
          <div className="viewerLinks">
            <Link className="topNavLink" to={`/start/${eventId}`}>
              Controller
            </Link>
            <button
              className="topNavLink"
              type="button"
              onClick={() => void document.documentElement.requestFullscreen?.()}
            >
              Fullscreen
            </button>
          </div>
        </div>
      ) : null}

      {kiosk ? (
        <Link
          className="viewerKioskBack"
          to={`/start/${eventId}`}
          title={t('viewer.backToControl')}
        >
          <SlidersIcon />
          <span>{t('viewer.backToControl')}</span>
        </Link>
      ) : null}

      <div className="viewerMain">
        {current ? (
          <>
            <StageDisplay
              template={settings.stageTemplate ?? 'circle'}
              remainingSec={remainingSec}
              durationSec={current.durationSec}
              currentName={current.name}
              currentLeader={current.leaderName}
              nextName={next?.name ?? null}
              nextLeader={next?.leaderName ?? null}
              theme={stageTheme}
              paused={phase === 'paused'}
            />
            {appConfig.liveMessageEnabled && activeMessage ? (
              <StageLiveMessageOverlay message={activeMessage} />
            ) : null}
            {blackout ? (
              <div className="viewerBlackout" aria-hidden={!serviceEnded}>
                {serviceEnded ? (
                  <p className="viewerServiceEnded" role="status">
                    {t('viewer.serviceEnded')}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : (
          <div className="stageEmpty muted">{t('viewer.noProgram')}</div>
        )}
      </div>

      {!kiosk ? (
        <div className="viewerFooter muted">
          {isLocal ? t('viewer.localSyncHint') : t('viewer.cloudSyncHint')}
          {isCloud && !hasFirebaseConfig() ? ` · ${t('viewer.firebaseRequired')}` : ''}
        </div>
      ) : (
        <div className="viewerFooter muted">{t('viewer.kioskFullscreen')}</div>
      )}
    </div>
  )
}
