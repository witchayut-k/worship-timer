import type { EventDisplaySettings } from '../domain/types'
import { useLocale } from '../i18n/useLocale'

type SetupAsidePanelProps = {
  settings: EventDisplaySettings
  onSettingsChange: (patch: Partial<EventDisplaySettings>) => void
  onOpenSpreadsheetImport: () => void
  canStart: boolean
  saving: boolean
  saveLabel: string
  saveNotice: string | null
  cloudMode: boolean
  cloudReady: boolean
  hasUid: boolean
  onSave: () => void
  onStartControl: () => void
  onStartLocalDemo: () => void
}

export function SetupAsidePanel({
  settings,
  onSettingsChange,
  onOpenSpreadsheetImport,
  canStart,
  saving,
  saveLabel,
  saveNotice,
  cloudMode,
  cloudReady,
  hasUid,
  onSave,
  onStartControl,
  onStartLocalDemo,
}: SetupAsidePanelProps) {
  const { t } = useLocale()

  return (
    <>
      <section className="asideCard setupActionsCard">
        <h2 className="asideCardTitle">{t('setup.startSection')}</h2>
        <div className="setupAsideActions">
          <button
            className="btnStart"
            type="button"
            disabled={!canStart || saving}
            onClick={onStartControl}
          >
            {saving ? t('setup.preparing') : t('setup.startControl')}
          </button>
          <button
            className="btn setupAsideSave"
            type="button"
            disabled={!canStart || saving}
            onClick={onSave}
          >
            {saving ? t('setup.saving') : saveLabel}
          </button>
        </div>
        <div className="setupAsideMeta">
          {saveNotice ? <p className="saveNotice">{saveNotice}</p> : null}
          {!cloudMode && cloudReady ? (
            <button
              className="btnGhost setupAsideSecondary"
              type="button"
              disabled={!canStart}
              onClick={onStartLocalDemo}
            >
              {t('setup.startLocalLegacy')}
            </button>
          ) : null}
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
