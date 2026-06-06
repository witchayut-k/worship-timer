import { useLocale } from '../i18n/useLocale'
import type { ControlLeaseStatus } from '../hooks/useControlLease'

type Props = {
  status: ControlLeaseStatus
  onTakeover: () => void
}

export function ControlLeaseBanner({ status, onTakeover }: Props) {
  const { t } = useLocale()

  if (status === 'claiming') {
    return (
      <footer className="appStatusBar appStatusBar--syncing" role="status" aria-live="polite">
        <span className="appStatusBarDot" aria-hidden />
        <span className="appStatusBarMessage">{t('control.lease.claiming')}</span>
      </footer>
    )
  }

  if (status !== 'observer') return null

  return (
    <footer className="appStatusBar appStatusBar--local" role="status" aria-live="polite">
      <span className="appStatusBarDot" aria-hidden />
      <span className="appStatusBarMessage">{t('control.lease.observerBanner')}</span>
      <button className="btn btnSm appStatusBarRetry" type="button" onClick={onTakeover}>
        {t('control.lease.takeover')}
      </button>
    </footer>
  )
}
