import type { EventSessionContextValue } from '../context/eventSessionContext'
import type { SetupSaveStatus } from '../hooks/useSetupAutoSave'

export function needsSetupPersistBeforeNav(
  session: EventSessionContextValue | null,
  saveStatus: SetupSaveStatus,
): boolean {
  if (saveStatus === 'pending' || saveStatus === 'saving' || saveStatus === 'error') {
    return true
  }
  if (!session) return false
  return session.isSetupDraftDirty()
}
