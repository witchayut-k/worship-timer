import { useLocale } from '../i18n/useLocale'
import { LightingCueIcon, MediaCueIcon } from './CrewCueIcons'

type Props = {
  kind: 'lighting' | 'media'
  text: string
}

export function CrewCueBox({ kind, text }: Props) {
  const { t } = useLocale()
  const label = kind === 'lighting' ? t('crew.lightingCue') : t('crew.mediaCue')

  return (
    <div className={`crewCueBox crewCueBox--${kind}`}>
      <div className="crewCueBoxHeader">
        {kind === 'lighting' ? (
          <>
            <span className="crewCueBoxLabel">{label}</span>
            <LightingCueIcon className="crewCueBoxIcon" />
          </>
        ) : (
          <>
            <MediaCueIcon className="crewCueBoxIcon" />
            <span className="crewCueBoxLabel">{label}</span>
          </>
        )}
      </div>
      <p className="crewCueBoxText">{text}</p>
    </div>
  )
}
