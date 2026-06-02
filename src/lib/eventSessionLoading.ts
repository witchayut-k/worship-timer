import type { EventSessionStatus } from '../context/eventSessionContext'

export type EventWorkspaceRoute = 'setup' | 'start'

export type WorkspaceLoadingPhase = 'auth' | 'session' | 'program'

export function getWorkspaceLoadingPhase(
  authReady: boolean,
  status: EventSessionStatus,
  hasSetupDraft: () => boolean,
  route: EventWorkspaceRoute,
  programItemsHydrated: boolean,
): WorkspaceLoadingPhase | null {
  if (!authReady) return 'auth'
  if (status === 'loading') {
    if (route === 'setup' && hasSetupDraft()) return null
    return 'session'
  }
  if (status === 'ready' && !programItemsHydrated) {
    if (route === 'start' || route === 'setup') return 'program'
  }
  return null
}

export function isEventWorkspaceBootLoading(
  authReady: boolean,
  status: EventSessionStatus,
  hasSetupDraft: () => boolean,
  route: EventWorkspaceRoute,
  programItemsHydrated: boolean,
): boolean {
  return (
    getWorkspaceLoadingPhase(
      authReady,
      status,
      hasSetupDraft,
      route,
      programItemsHydrated,
    ) !== null
  )
}

export function workspaceLoadingMessageKey(
  phase: WorkspaceLoadingPhase | null,
): string {
  switch (phase) {
    case 'auth':
      return 'loading.signingIn'
    case 'session':
      return 'loading.loadingEvent'
    case 'program':
      return 'loading.loadingProgramItems'
    default:
      return 'setup.loadingProgram'
  }
}
