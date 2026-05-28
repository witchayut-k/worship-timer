import type { DraftItem } from '../components/SetupSegmentList'
import type { EventSessionContextValue } from '../context/eventSessionContext'
import type { SetupSaveStatus } from '../hooks/useSetupAutoSave'
import {
  draftItemsToProgramItems,
  programItemsContentSnapshot,
} from './eventSessionDraft'

export function isWorkspaceProgramOutOfSync(
  session: EventSessionContextValue,
  localDraftItems: DraftItem[],
): boolean {
  const local = draftItemsToProgramItems(localDraftItems)
  return (
    programItemsContentSnapshot(session.programItems) !==
    programItemsContentSnapshot(local)
  )
}

export function needsSetupPersistBeforeNav(
  session: EventSessionContextValue | null,
  saveStatus: SetupSaveStatus,
  localDraftItems?: DraftItem[],
): boolean {
  if (saveStatus === 'pending' || saveStatus === 'saving' || saveStatus === 'error') {
    return true
  }
  if (!session) return false
  if (session.isSetupDraftDirty()) return true
  if (localDraftItems && isWorkspaceProgramOutOfSync(session, localDraftItems)) {
    return true
  }
  return false
}
