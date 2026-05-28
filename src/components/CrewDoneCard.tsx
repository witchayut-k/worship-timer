import type { ProgramItem } from '../domain/types'
import { formatSecToMmSs } from '../domain/time'
import { useLocale } from '../i18n/useLocale'

type Props = {
  item: ProgramItem
}

export function CrewDoneCard({ item }: Props) {
  const { t } = useLocale()

  return (
    <div className="crewDoneBar" aria-label={t('crew.done')}>
      <span className="crewDoneBarLabel">{t('crew.done')}</span>
      <span className="crewDoneBarTitle">{item.name}</span>
      <span className="crewDoneBarDuration timeMono">{formatSecToMmSs(item.durationSec)}</span>
    </div>
  )
}
