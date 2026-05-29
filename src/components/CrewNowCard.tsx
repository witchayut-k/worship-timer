import { useMemo } from 'react'
import type { ProgramItem, RuntimePhase } from '../domain/types'
import { formatSignedMMSS } from '../domain/time'
import { useLocale } from '../i18n/useLocale'
import { computeRemainingRatio } from '../lib/stageProgress'
import { CrewCueBox } from './CrewCueBox'
import { HostCueIcon } from './CrewCueIcons'

type Props = {
  current: ProgramItem
  phase: RuntimePhase
  remainingSec: number
  durationSec: number
  serviceEnded?: boolean
}

export function CrewNowCard({
  current,
  phase,
  remainingSec,
  durationSec,
  serviceEnded = false,
}: Props) {
  const { t } = useLocale()
  const isRunning = phase === 'running'
  const isPaused = phase === 'paused'

  const isOvertime = remainingSec < 0
  const timerLabel = isOvertime ? t('crew.overtime') : t('crew.remaining')
  const progressStatus = isOvertime ? 'overtime' : isPaused ? 'paused' : 'remaining'

  const fillPct = useMemo(() => {
    const remainingRatio = computeRemainingRatio(remainingSec, durationSec)
    const isOver = remainingSec < 0
    return isOver ? 100 : Math.round((1 - remainingRatio) * 100)
  }, [remainingSec, durationSec])

  const lights = current.roomLights?.trim()
  const media = current.mediaNote?.trim()
  const hostName = current.leaderName?.trim() || '—'

  return (
    <section
      className={`crewHero${serviceEnded ? ' crewHero--ended' : ''}`}
      aria-label={serviceEnded ? t('crew.serviceEnded') : t('crew.nowPlaying')}
    >
      <div className="crewHeroBody">
        <div className="crewHeroBadges">
          {serviceEnded ? (
            <span className="scheduleBadge scheduleBadgeEnded">{t('crew.serviceEnded')}</span>
          ) : isRunning ? (
            <span className="scheduleBadge scheduleBadgeCurrent crewLiveBadge">
              <span className="segmentLiveDot segmentLiveDotPulse" aria-hidden />
              {t('control.scheduleLive')}
            </span>
          ) : isPaused ? (
            <span className="scheduleBadge scheduleBadgePaused">{t('control.paused')}</span>
          ) : null}
          <p className="crewHeroHost" aria-label={t('crew.host')}>
            <HostCueIcon className="crewHeroHostIcon" />
            <span className="crewHeroHostName">{hostName}</span>
          </p>
        </div>
        <div className="crewHeroMain">
          <div className="crewHeroInfo">
            <h2 className="crewHeroTitle">{current.name}</h2>
          </div>
          {!serviceEnded ? (
            <div className={`crewHeroTimerBlock${isOvertime ? ' crewHeroTimerBlock--overtime' : ''}`}>
              <span className="crewHeroTimerLabel">{timerLabel}</span>
              <div
                className="crewHeroTimer"
                aria-live="polite"
                aria-label={isOvertime ? `${t('crew.overtime')}, ${formatSignedMMSS(remainingSec)}` : undefined}
              >
                {formatSignedMMSS(remainingSec)}
              </div>
            </div>
          ) : null}
        </div>
        {(lights || media) && (
          <div className="crewHeroCues">
            {lights ? <CrewCueBox kind="lighting" text={lights} /> : null}
            {media ? <CrewCueBox kind="media" text={media} /> : null}
          </div>
        )}
      </div>
      {!serviceEnded ? (
        <div className={`crewHeroProgress crewHeroProgress--${progressStatus}`} aria-hidden>
          <div className="crewHeroProgressTrack">
            <div className="crewHeroProgressFill" style={{ width: `${fillPct}%` }} />
          </div>
        </div>
      ) : null}
    </section>
  )
}
