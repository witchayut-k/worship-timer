export const appConfig = {
  /** Minimum time full-screen loading stays visible (ms). Set 0 to disable. */
  fullScreenLoadingMinMs: 0,
  /** When true, show the view-settings (gear) button in app header and Crew header. */
  showSettingsButton: false,
  /** Feature flag for live message (controller -> stage/crew). */
  liveMessageEnabled: false,
  /** When true, single-writer lease on /start (cloud). */
  controlLeaseEnabled: false,
  /** One pulse cycle (ms) for flash button, control timer, and stage flash animations. */
  flashBlinkCycleMs: 1000,
} as const

export function isControlLeaseEnabled(): boolean {
  return appConfig.controlLeaseEnabled
}

export function applyFlashBlinkCssVars(): void {
  document.documentElement.style.setProperty(
    '--flash-blink-cycle-ms',
    `${appConfig.flashBlinkCycleMs}ms`,
  )
}
