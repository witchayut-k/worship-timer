import type { EventDisplaySettings } from '../domain/types'

type SetupAsidePanelProps = {
  settings: EventDisplaySettings
  onSettingsChange: (patch: Partial<EventDisplaySettings>) => void
}

export function SetupAsidePanel({ settings, onSettingsChange }: SetupAsidePanelProps) {
  return (
    <>
      <section className="asideCard">
        <h2 className="asideCardTitle">เครื่องมือ</h2>
        <div className="toolGrid">
          <button
            className="toolTile toolTileDisabled"
            type="button"
            disabled
            title="เร็วๆ นี้"
          >
            <span className="toolTileIcon" aria-hidden>
              📋
            </span>
            เทมเพลต
          </button>
          <button
            className="toolTile toolTileDisabled"
            type="button"
            disabled
            title="เร็วๆ นี้"
          >
            <span className="toolTileIcon" aria-hidden>
              ▶
            </span>
            เลื่อนอัตโนมัติ
          </button>
        </div>
      </section>

      <section className="asideCard">
        <h2 className="asideCardTitle">การแจ้งเตือน</h2>
        <div className="alertSettingRow">
          <div className="alertSettingText">
            <div className="alertSettingTitle">กระพริบเมื่อเกินเวลา</div>
            <div className="alertSettingDesc">จอจะกระพริบสีแดงเมื่อเวลาติดลบ</div>
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
            <div className="alertSettingTitle">เตือนก่อนหมดเวลา</div>
            <div className="alertSettingDesc">เปลี่ยนเป็นสีเหลืองเมื่อเหลือ 1 นาที</div>
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
