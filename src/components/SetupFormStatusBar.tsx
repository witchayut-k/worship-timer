import type { SetupSaveStatus } from '../hooks/useSetupAutoSave'
import { useLocale } from '../i18n/useLocale'

type SetupFormStatusBarProps = {
  isDirty: boolean
  saveStatus: SetupSaveStatus
  saveNotice: string | null
}

function statusModifier(
  isDirty: boolean,
  saveStatus: SetupSaveStatus,
): string | null {
  if (saveStatus === 'error') return 'appStatusBar--error'
  if (saveStatus === 'saving') return 'appStatusBar--syncing'
  if (saveStatus === 'saved' && !isDirty) return 'appStatusBar--synced'
  if (isDirty) return 'appStatusBar--unsaved'
  return null
}

export function SetupFormStatusBar({
  isDirty,
  saveStatus,
  saveNotice,
}: SetupFormStatusBarProps) {
  const { t } = useLocale()
  const modifier = statusModifier(isDirty, saveStatus)
  if (!modifier) return null

  const message =
    saveStatus === 'error'
      ? (saveNotice ?? t('setup.saveFailed'))
      : saveStatus === 'saving'
        ? t('setup.saving')
        : saveStatus === 'saved' && !isDirty
          ? (saveNotice ?? t('setup.saved'))
          : t('setup.statusUnsaved')

  return (
    <footer
      className={`appStatusBar ${modifier}`}
      role="status"
      aria-live="polite"
    >
      <span className="appStatusBarDot" aria-hidden />
      <span className="appStatusBarMessage">{message}</span>
    </footer>
  )
}
