import { Link } from 'react-router-dom'
import { ListIcon, SlidersIcon } from './SetupIcons'
import { useLocale } from '../i18n/useLocale'

type Props = {
  setupPath: string
}

export function ControlEmptyStage({ setupPath }: Props) {
  const { t } = useLocale()

  return (
    <div className="controlEmptyStage">
      <div className="controlEmptyStageVisual" aria-hidden>
        <svg className="controlEmptyStageRing" viewBox="0 0 96 96" fill="none">
          <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="6 5" />
          <circle cx="48" cy="48" r="28" stroke="currentColor" strokeWidth="1" opacity="0.35" />
        </svg>
        <span className="controlEmptyStageIcon">
          <SlidersIcon />
        </span>
      </div>
      <h2 className="controlEmptyStageTitle">{t('control.emptyStageTitle')}</h2>
      <p className="controlEmptyStageDesc">{t('control.emptyStageDesc')}</p>
      <div className="controlEmptyStageActions">
        <Link className="btnPrimary btnWithIcon" to={setupPath}>
          <ListIcon />
          <span>{t('control.emptyStageCta')}</span>
        </Link>
      </div>
    </div>
  )
}
