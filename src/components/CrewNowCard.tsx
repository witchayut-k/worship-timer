import type { ProgramItem, RuntimePhase } from '../domain/types'
import { formatSignedMMSS } from '../domain/time'
import { useLocale } from '../i18n/useLocale'

type Props = {
  current: ProgramItem
  next: ProgramItem | null
  phase: RuntimePhase
  remainingSec: number
  serviceEnded?: boolean
}

export function CrewNowCard({ current, next, phase, remainingSec, serviceEnded = false }: Props) {
  const { t } = useLocale()
  const isRunning = phase === 'running'
  const isPaused = phase === 'paused'
  const lights = current.roomLights?.trim()
  const media = current.mediaNote?.trim()
  const nextLights = next?.roomLights?.trim()
  const nextMedia = next?.mediaNote?.trim()

  return (
    <section
      className={`crewNowSticky${serviceEnded ? ' crewNowSticky--ended' : ''}`}
      aria-label={serviceEnded ? t('crew.serviceEnded') : t('crew.nowPlaying')}
    >
      <div className="crewNowHeader">
        <span className="crewNowLabel">{t('control.current')}</span>
        {serviceEnded ? (
          <span className="scheduleBadge scheduleBadgeEnded">{t('crew.serviceEnded')}</span>
        ) : isRunning ? (
          <span className="scheduleBadge scheduleBadgeCurrent">{t('control.current')}</span>
        ) : isPaused ? (
          <span className="scheduleBadge scheduleBadgePaused">{t('control.paused')}</span>
        ) : null}
      </div>
      <h2 className="crewNowTitle">{current.name}</h2>
      {current.leaderName ? <p className="crewNowLeader muted">{current.leaderName}</p> : null}
      {!serviceEnded ? (
        <div className="crewNowTimer timeMono" aria-live="polite">
          {formatSignedMMSS(remainingSec)}
        </div>
      ) : null}
      {(lights || media) && (
        <div className="crewNowCrewNotes">
          {lights ? (
            <div className="crewCrewNote">
              <span className="crewCrewNoteLabel">{t('setupSegment.lights')}</span>
              <span>{lights}</span>
            </div>
          ) : null}
          {media ? (
            <div className="crewCrewNote">
              <span className="crewCrewNoteLabel">{t('setupSegment.media')}</span>
              <span>{media}</span>
            </div>
          ) : null}
        </div>
      )}
      {next ? (
        <div className="crewNextTeaser">
          <span className="crewNextLabel">{t('control.next')}</span>
          <span className="crewNextName">{next.name}</span>
          {(nextLights || nextMedia) && (
            <span className="crewNextMeta muted">
              {[nextLights, nextMedia].filter(Boolean).join(' · ')}
            </span>
          )}
        </div>
      ) : null}
    </section>
  )
}
