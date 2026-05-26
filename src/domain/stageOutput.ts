export const MANUAL_FLASH_DURATION_MS = 5000

export function isManualFlashActive(untilMs: number | null | undefined, nowMs: number): boolean {
  return untilMs != null && nowMs < untilMs
}
