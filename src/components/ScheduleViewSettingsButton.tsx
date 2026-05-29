import { useState } from 'react'
import { appConfig } from '../config/app.config'
import { SettingsIcon } from './SetupIcons'
import {
  ScheduleViewSettingsModal,
  type ScheduleViewSettingsVariant,
} from './ScheduleViewSettingsModal'
import { useLocale } from '../i18n/useLocale'

type Props = {
  variant?: ScheduleViewSettingsVariant
  timelineAvailable?: boolean
}

export function ScheduleViewSettingsButton({
  variant = 'default',
  timelineAvailable = false,
}: Props) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)

  if (!appConfig.showSettingsButton) return null

  return (
    <>
      <button
        className="headerIconBtn"
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('settings.openLabel')}
        title={t('settings.openLabel')}
      >
        <SettingsIcon />
      </button>
      <ScheduleViewSettingsModal
        open={open}
        onClose={() => setOpen(false)}
        variant={variant}
        timelineAvailable={timelineAvailable}
      />
    </>
  )
}
