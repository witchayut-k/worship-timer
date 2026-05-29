import { useLocale } from '../i18n/useLocale'

type SetupEventDetailsCardProps = {
  title: string
  titleError: string | null
  date: string
  plannedStartTime: string
  onTitleChange: (value: string) => void
  onDateChange: (value: string) => void
  onPlannedStartTimeChange: (value: string) => void
}

export function SetupEventDetailsCard({
  title,
  titleError,
  date,
  plannedStartTime,
  onTitleChange,
  onDateChange,
  onPlannedStartTimeChange,
}: SetupEventDetailsCardProps) {
  const { t } = useLocale()

  return (
    <section className="card setupEventCard setupAsideSection">
      {/* <div className="cardHeader">
        <h2 className="cardTitle setupAsideSectionTitle">{t('setup.eventDetails')}</h2>
      </div> */}
      <div className="setupEventGrid">
        <label className="field setupEventTitleField">
          <div className="label">{t('setup.eventTitle')}</div>
          <input
            value={title}
            placeholder={t('event.untitled')}
            aria-invalid={titleError != null}
            onChange={(e) => onTitleChange(e.target.value)}
          />
          {titleError ? <p className="fieldError">{titleError}</p> : null}
        </label>
        <label className="field">
          <div className="label">{t('setup.date')}</div>
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
        </label>
        <label className="field setupEventTimeField">
          {/* <div className="label labelWithTag"> */}
          <div className="label">
            <span>{t('setup.plannedStart')}</span>
            {/* <span className="labelTag">{t('common.optional')}</span> */}
          </div>
          <input
            type="time"
            value={plannedStartTime}
            placeholder={t('setup.plannedStartPlaceholder')}
            onChange={(e) => onPlannedStartTimeChange(e.target.value)}
          />
        </label>
      </div>
    </section>
  )
}
