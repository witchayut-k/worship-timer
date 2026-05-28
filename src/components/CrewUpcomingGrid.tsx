import type { ReactNode } from 'react'
import type { ProgramItem } from '../domain/types'
import { formatSecToMmSs } from '../domain/time'
import { useLocale } from '../i18n/useLocale'
import { CrewCueBox } from './CrewCueBox'

type Props = {
  items: ProgramItem[]
  currentIndex: number
}

type UpcomingLabelKey = 'crew.upNext' | 'crew.then'

function SegmentCardShell({
  label,
  item,
  children,
}: {
  label: string
  item: ProgramItem
  children?: ReactNode
}) {
  return (
    <article className="crewUpcomingCard">
      <header className="crewUpcomingCardHeader">
        <span className="crewUpcomingCardLabel">{label}</span>
        <span className="crewUpcomingCardDuration timeMono">{formatSecToMmSs(item.durationSec)}</span>
      </header>
      <h3 className="crewUpcomingCardTitle">{item.name}</h3>
      {children}
    </article>
  )
}

function CrewUpcomingCard({
  item,
  positionKey,
}: {
  item: ProgramItem
  positionKey: UpcomingLabelKey
}) {
  const { t } = useLocale()
  const lights = item.roomLights?.trim()
  const media = item.mediaNote?.trim()

  return (
    <SegmentCardShell label={t(positionKey)} item={item}>
      {(lights || media) && (
        <div className="crewUpcomingCardCues">
          {lights ? <CrewCueBox kind="lighting" text={lights} /> : null}
          {media ? <CrewCueBox kind="media" text={media} /> : null}
        </div>
      )}
    </SegmentCardShell>
  )
}

export function CrewUpcomingGrid({ items, currentIndex }: Props) {
  const { t } = useLocale()
  const upNextItem = items[currentIndex + 1] ?? null
  const thenItem = items[currentIndex + 2] ?? null

  if (!upNextItem && !thenItem) return null

  return (
    <section className="crewUpcomingGrid" aria-label={t('crew.segmentContext')}>
      {upNextItem ? (
        <CrewUpcomingCard
          key={`upnext-${upNextItem.order}-${upNextItem.name}`}
          item={upNextItem}
          positionKey="crew.upNext"
        />
      ) : null}
      {thenItem ? (
        <CrewUpcomingCard
          key={`then-${thenItem.order}-${thenItem.name}`}
          item={thenItem}
          positionKey="crew.then"
        />
      ) : null}
    </section>
  )
}
