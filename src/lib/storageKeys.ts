export const STORAGE_PREFIX = 'controlstage'

export const storageKeys = {
  locale: `${STORAGE_PREFIX}:locale`,
  library: `${STORAGE_PREFIX}:library`,
  activeControl: `${STORAGE_PREFIX}:active-control`,
  event: (eventId: string) => `${STORAGE_PREFIX}:${eventId}`,
  runtime: (eventId: string) => `${STORAGE_PREFIX}:runtime:${eventId}`,
} as const
