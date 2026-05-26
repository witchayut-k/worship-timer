import type { EventDisplaySettings } from '../domain/types'
import { useLocale } from '../i18n/useLocale'

type SetupAsidePanelProps = {
  settings: EventDisplaySettings
  onSettingsChange: (patch: Partial<EventDisplaySettings>) => void
  onOpenSpreadsheetImport: () => void
}

export function SetupAsidePanel({
  settings,
  onSettingsChange,
  onOpenSpreadsheetImport,
}: SetupAsidePanelProps) {
  const { t } = useLocale()

  return (
    <>
      <section className="asideCard">
        <h2 className="asideCardTitle">{t('setupAside.tools')}</h2>
        <div className="toolGrid">
          <button className="toolTile" type="button" onClick={onOpenSpreadsheetImport}>
            <span className="toolTileIcon" aria-hidden>
              📋
            </span>
            {t('setupAside.importSpreadsheet')}
          </button>
          <button
            className="toolTile toolTileDisabled"
            type="button"
            disabled
            title={t('setupAside.comingSoon')}
          >
            <span className="toolTileIcon" aria-hidden>
              ▶
            </span>
            {t('setupAside.autoAdvance')}
          </button>
        </div>
      </section>

      <section className="asideCard">
        <h2 className="asideCardTitle">{t('setupAside.alerts')}</h2>
        <div className="alertSettingRow">
          <div className="alertSettingText">
            <div className="alertSettingTitle">{t('setupAside.overtimeFlash')}</div>
            <div className="alertSettingDesc">{t('setupAside.overtimeFlashDesc')}</div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.overtimeFlash}
              onChange={(e) => onSettingsChange({ overtimeFlash: e.target.checked })}
            />
            <span className="switchSlider" />
          </label>
        </div>
        <div className="alertSettingRow">
          <div className="alertSettingText">
            <div className="alertSettingTitle">{t('setupAside.warningOneMinute')}</div>
            <div className="alertSettingDesc">{t('setupAside.warningOneMinuteDesc')}</div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.warningAtOneMinute}
              onChange={(e) => onSettingsChange({ warningAtOneMinute: e.target.checked })}
            />
            <span className="switchSlider" />
          </label>
        </div>
      </section>
    </>
  )
}
