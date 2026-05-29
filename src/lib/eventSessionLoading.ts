import type { EventSessionStatus } from '../context/eventSessionContext'

export type EventWorkspaceRoute = 'setup' | 'start'

export function isEventWorkspaceBootLoading(
  authReady: boolean,
  status: EventSessionStatus,
  hasSetupDraft: () => boolean,
  route: EventWorkspaceRoute,
  programItemsHydrated: boolean,
): boolean {
  if (!authReady) return true
  if (status === 'loading') {
    if (route === 'setup') return !hasSetupDraft()
    return true
  }
  if (status === 'ready' && !programItemsHydrated) {
    if (route === 'start' || route === 'setup') return true
  }
  return false
}
