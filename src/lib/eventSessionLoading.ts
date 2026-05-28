import type { EventSessionStatus } from '../context/eventSessionContext'

export type EventWorkspaceRoute = 'setup' | 'start'

export function isEventWorkspaceBootLoading(
  authReady: boolean,
  status: EventSessionStatus,
  hasSetupDraft: () => boolean,
  route: EventWorkspaceRoute,
): boolean {
  if (!authReady) return true
  if (status !== 'loading') return false
  if (route === 'setup') return !hasSetupDraft()
  return true
}
