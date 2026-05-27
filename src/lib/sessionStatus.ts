import type { RuntimePhase } from '../domain/types'

export type SessionStatusVariant = 'ready' | 'live' | 'paused' | 'controlling'

export function resolveSessionStatus(params: {
  productionMode: boolean
  phase: RuntimePhase | null
  ready: boolean
}): {
  variant: SessionStatusVariant
  label: (t: (key: string) => string) => string
} {
  const { productionMode, phase, ready } = params

  if (!productionMode) {
    return {
      variant: 'ready',
      label: (t) => t('nav.sessionReady'),
    }
  }

  if (!ready || phase == null) {
    return {
      variant: 'controlling',
      label: (t) => t('nav.controlling'),
    }
  }

  if (phase === 'running') {
    return {
      variant: 'live',
      label: (t) => t('nav.live'),
    }
  }

  if (phase === 'paused') {
    return {
      variant: 'paused',
      label: (t) => t('control.paused'),
    }
  }

  return {
    variant: 'controlling',
    label: (t) => t('nav.controlling'),
  }
}
