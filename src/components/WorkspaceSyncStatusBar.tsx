import type { WorkspaceSyncStatus } from '../lib/workspaceCloudSync'
import { useOptionalWorkspaceSync } from '../hooks/useWorkspaceSync'
import { useLocale } from '../i18n/useLocale'

function statusMessageKey(status: WorkspaceSyncStatus): string {
  switch (status) {
    case 'localOnly':
      return 'sync.localSaved'
    case 'pending':
      return 'sync.pending'
    case 'syncing':
      return 'sync.syncing'
    case 'synced':
      return 'sync.synced'
    case 'error':
      return 'sync.error'
    default:
      return 'sync.localSaved'
  }
}

function statusModifier(status: WorkspaceSyncStatus): string {
  switch (status) {
    case 'synced':
      return 'appStatusBar--synced'
    case 'syncing':
    case 'pending':
      return 'appStatusBar--syncing'
    case 'error':
      return 'appStatusBar--error'
    default:
      return 'appStatusBar--local'
  }
}

export function WorkspaceSyncStatusBar() {
  const { t } = useLocale()
  const workspaceSync = useOptionalWorkspaceSync()

  if (!workspaceSync) return null

  const { status, retrySync } = workspaceSync
  if (status === 'synced' || status === 'localOnly') return null

  const message = t(statusMessageKey(status))

  return (
    <footer
      className={`appStatusBar ${statusModifier(status)}`}
      role="status"
      aria-live="polite"
    >
      <span className="appStatusBarDot" aria-hidden />
      <span className="appStatusBarMessage">{message}</span>
      {status === 'error' ? (
        <button type="button" className="btnGhost btnSm appStatusBarRetry" onClick={retrySync}>
          {t('sync.retry')}
        </button>
      ) : null}
    </footer>
  )
}
