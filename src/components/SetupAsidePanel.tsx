import type { EventDisplaySettings } from '../domain/types'
import { PlayIcon, SaveIcon, TableIcon } from './SetupIcons'
import { useLocale } from '../i18n/useLocale'

type SetupAsidePanelProps = {
  settings: EventDisplaySettings
  onSettingsChange: (patch: Partial<EventDisplaySettings>) => void
  onOpenSpreadsheetImport: () => void
  canStart: boolean
  saving: boolean
  saveNotice: string | null
  productionMode: boolean
  cloudReady: boolean
  hasUid: boolean
  onSave: () => void
  onStartControl: () => void
}

export function SetupAsidePanel({
  settings,
  onSettingsChange,
  onOpenSpreadsheetImport,
  canStart,
  saving,
  saveNotice,
  productionMode,
  cloudReady,
  hasUid,
  onSave,
  onStartControl,
}: SetupAsidePanelProps) {
  const { t } = useLocale()

  return (
    <>
      <section className="asideCard setupActionsCard">
        <h2 className="asideCardTitle">{t('setup.startSection')}</h2>
        <div className="setupAsideActions">
          {!productionMode ? (
            <button
              className="btnStart btnWithIcon"
              type="button"
              disabled={!canStart || saving}
              onClick={onStartControl}
            >
              <PlayIcon />
              <span>{saving ? t('setup.preparing') : t('setup.start')}</span>
            </button>
          ) : null}
          <button
            className="btn setupAsideSave btnWithIcon"
            type="button"
            disabled={!canStart || saving}
            onClick={onSave}
          >
            <SaveIcon />
            <span>{saving ? t('setup.saving') : t('setup.save')}</span>
          </button>
        </div>
        <div className="setupAsideMeta">
          {saveNotice ? <p className="saveNotice">{saveNotice}</p> : null}
          {cloudReady && !hasUid ? <p className="muted">{t('setup.signInForCloud')}</p> : null}
          {!cloudReady ? (
            <p className="muted">
              {t('setup.cloudEnvHint', { envFile: '.env.local', envExample: '.env.example' })}
            </p>
          ) : null}
        </div>
      </section>

      <section className="asideCard">
        <h2 className="asideCardTitle">{t('setupAside.tools')}</h2>
        <div className="toolGrid">
          <button className="toolTile" type="button" onClick={onOpenSpreadsheetImport}>
            <span className="toolTileIcon" aria-hidden>
              <TableIcon />
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
              <PlayIcon />
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
