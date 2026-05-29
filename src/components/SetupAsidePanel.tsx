import type {
  EventDisplaySettings,
  StageDisplayTemplate,
} from "../domain/types";
import type { SetupSaveStatus } from "../hooks/useSetupAutoSave";
import { SetupStageTemplatePicker } from "./SetupStageTemplatePicker";
import { useLocale } from "../i18n/useLocale";

type SetupAsidePanelProps = {
  settings: EventDisplaySettings;
  onSettingsChange: (patch: Partial<EventDisplaySettings>) => void;
  canStart: boolean;
  saving: boolean;
  saveStatus: SetupSaveStatus;
  saveNotice: string | null;
  productionMode: boolean;
  cloudReady: boolean;
  hasUid: boolean;
  showCloudHints?: boolean;
  onStartControl: () => void;
};

export function SetupAsidePanel({
  settings,
  onSettingsChange,
  // canStart,
  // saving,
  // saveStatus,
  // saveNotice,
  // productionMode,
  // onStartControl,
}: SetupAsidePanelProps) {
  const { t } = useLocale();

  // const showSaveStatus =
  //   saveStatus === 'pending' || saveStatus === 'saving' || saveStatus === 'saved' || saveStatus === 'error'

  // const statusMessage =
  //   saveStatus === 'pending' || saveStatus === 'saving'
  //     ? t('setup.saving')
  //     : saveNotice ?? (saveStatus === 'saved' ? t('setup.saved') : null)

  return (
    <>
      {/* <section className="asideCard setupActionsCard">
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
        </div>
        {showSaveStatus && statusMessage ? (
          <div className="setupAsideMeta">
            <p
              className={`saveNotice${saveStatus === 'error' ? ' saveNoticeError' : ''}`}
              role="status"
              aria-live="polite"
            >
              {statusMessage}
            </p>
          </div>
        ) : null}
      </section> */}

      <section className="asideCard setupAsideSection setupAsideSectionStage">
        <h2 className="asideCardTitle setupAsideSectionTitle">
          {t("setupAside.stageDisplay")}
        </h2>
        <SetupStageTemplatePicker
          value={settings.stageTemplate ?? "circle"}
          onChange={(stageTemplate: StageDisplayTemplate) =>
            onSettingsChange({ stageTemplate })
          }
        />
      </section>

      <section className="asideCard setupAsideSection setupAsideSectionAlerts">
        <h2 className="asideCardTitle setupAsideSectionTitle">
          {t("setupAside.alerts")}
        </h2>
        <div className="alertSettingRow">
          <div className="alertSettingText">
            <div className="alertSettingTitle">
              {t("setupAside.overtimeFlash")}
            </div>
            <div className="alertSettingDesc">
              {t("setupAside.overtimeFlashDesc")}
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.overtimeFlash}
              onChange={(e) =>
                onSettingsChange({ overtimeFlash: e.target.checked })
              }
            />
            <span className="switchSlider" />
          </label>
        </div>
        <div className="alertSettingRow">
          <div className="alertSettingText">
            <div className="alertSettingTitle">
              {t("setupAside.warningOneMinute")}
            </div>
            <div className="alertSettingDesc">
              {t("setupAside.warningOneMinuteDesc")}
            </div>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.warningAtOneMinute}
              onChange={(e) =>
                onSettingsChange({ warningAtOneMinute: e.target.checked })
              }
            />
            <span className="switchSlider" />
          </label>
        </div>
      </section>
    </>
  );
}
