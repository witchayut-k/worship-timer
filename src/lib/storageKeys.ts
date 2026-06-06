export const STORAGE_PREFIX = 'controlstage'

export const storageKeys = {
  locale: `${STORAGE_PREFIX}:locale`,
  library: `${STORAGE_PREFIX}:library`,
  activeControl: `${STORAGE_PREFIX}:active-control`,
  event: (eventId: string) => `${STORAGE_PREFIX}:${eventId}`,
  runtime: (eventId: string) => `${STORAGE_PREFIX}:runtime:${eventId}`,
  workspace: (eventId: string) => `${STORAGE_PREFIX}:workspace:${eventId}`,
  controlLeaseSession: (eventId: string) => `${STORAGE_PREFIX}:control-lease-session:${eventId}`,
} as const
