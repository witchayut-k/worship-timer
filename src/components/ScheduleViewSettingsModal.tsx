import { useEffect, useRef } from 'react'
import { SettingsIcon } from './SetupIcons'
import { useAutoStartOnNext } from '../hooks/useAutoStartOnNext'
import {
  useScheduleViewPrefs,
  type ScheduleViewPrefs,
} from '../hooks/useScheduleViewPrefs'
import { useLocale } from '../i18n/useLocale'

export type ScheduleViewSettingsVariant = 'default' | 'setup' | 'control' | 'crew'

type Props = {
  open: boolean
  onClose: () => void
  variant?: ScheduleViewSettingsVariant
  timelineAvailable?: boolean
}

type ToggleRowProps = {
  title: string
  desc: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

function ToggleRow({ title, desc, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="alertSettingRow">
      <div className="alertSettingText">
        <div className="alertSettingTitle">{title}</div>
        <div className="alertSettingDesc">{desc}</div>
      </div>
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="switchSlider" />
      </label>
    </div>
  )
}

function ScheduleSection({
  prefs,
  setPatch,
  timelineAvailable,
}: {
  prefs: ScheduleViewPrefs
  setPatch: (patch: Partial<ScheduleViewPrefs>) => void
  timelineAvailable: boolean
}) {
  const { t } = useLocale()

  return (
    <section className="settingsModalSection">
      <h3 className="settingsModalSectionTitle">{t('settings.sectionSchedule')}</h3>
      {!timelineAvailable ? (
        <p className="settingsModalHint muted">{t('settings.timelineRequiresEvent')}</p>
      ) : null}
      <ToggleRow
        title={t('settings.showPlannedTimes')}
        desc={t('settings.showPlannedTimesDesc')}
        checked={prefs.showPlannedTimes}
        disabled={!timelineAvailable}
        onChange={(showPlannedTimes) => setPatch({ showPlannedTimes })}
      />
      <ToggleRow
        title={t('settings.showTimelineRail')}
        desc={t('settings.showTimelineRailDesc')}
        checked={prefs.showTimelineRail}
        disabled={!timelineAvailable}
        onChange={(showTimelineRail) => setPatch({ showTimelineRail })}
      />
      <ToggleRow
        title={t('settings.showRowTimes')}
        desc={t('settings.showRowTimesDesc')}
        checked={prefs.showRowTimes}
        onChange={(showRowTimes) => setPatch({ showRowTimes })}
      />
    </section>
  )
}

export function ScheduleViewSettingsModal({
  open,
  onClose,
  variant = 'default',
  timelineAvailable = false,
}: Props) {
  const { t } = useLocale()
  const closeRef = useRef<HTMLButtonElement>(null)
  const { prefs, setPatch } = useScheduleViewPrefs()
  const { autoStartOnNext, setAutoStartOnNext } = useAutoStartOnNext()

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="modalOverlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="modalCard settingsViewModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-view-settings-title"
      >
        <header className="modalHeader">
          <h2 id="schedule-view-settings-title" className="modalTitle">
            <SettingsIcon />
            {t('settings.title')}
          </h2>
          <button
            ref={closeRef}
            className="btnGhost modalClose"
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            ✕
          </button>
        </header>

        <div className="modalBody settingsViewModalBody">
          <ScheduleSection
            prefs={prefs}
            setPatch={setPatch}
            timelineAvailable={timelineAvailable}
          />

          {variant === 'control' ? (
            <section className="settingsModalSection">
              <h3 className="settingsModalSectionTitle">{t('settings.sectionControl')}</h3>
              <ToggleRow
                title={t('control.autoStartOnNext')}
                desc={t('control.autoStartOnNextHint')}
                checked={autoStartOnNext}
                onChange={setAutoStartOnNext}
              />
            </section>
          ) : null}

          {variant === 'crew' ? (
            <section className="settingsModalSection">
              <h3 className="settingsModalSectionTitle">{t('settings.sectionCrew')}</h3>
              <ToggleRow
                title={t('settings.showCrewNotes')}
                desc={t('settings.showCrewNotesDesc')}
                checked={prefs.showCrewNotes}
                onChange={(showCrewNotes) => setPatch({ showCrewNotes })}
              />
              <ToggleRow
                title={t('settings.scrollActiveIntoView')}
                desc={t('settings.scrollActiveIntoViewDesc')}
                checked={prefs.scrollActiveIntoView}
                onChange={(scrollActiveIntoView) => setPatch({ scrollActiveIntoView })}
              />
            </section>
          ) : null}
        </div>

        <footer className="modalFooter settingsViewModalFooter">
          <button className="btnPrimary" type="button" onClick={onClose}>
            {t('common.close')}
          </button>
        </footer>
      </div>
    </div>
  )
}
