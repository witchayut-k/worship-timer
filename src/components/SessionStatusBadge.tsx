import type { RuntimePhase } from '../domain/types'
import { resolveSessionStatus } from '../lib/sessionStatus'
import { useLocale } from '../i18n/useLocale'

type SessionStatusBadgeProps = {
  productionMode: boolean
  phase: RuntimePhase | null
  ready: boolean
  serviceEnded?: boolean
}

export function SessionStatusBadge({
  productionMode,
  phase,
  ready,
  serviceEnded = false,
}: SessionStatusBadgeProps) {
  const { t } = useLocale()
  const { variant, label } = resolveSessionStatus({ productionMode, phase, ready, serviceEnded })

  return (
    <span
      className={`sessionStatusBadge sessionStatusBadge--${variant}`}
      role="status"
      aria-live="polite"
    >
      {variant === 'live' ? (
        <span className="sessionStatusLiveDot" aria-hidden />
      ) : null}
      <span>{label(t)}</span>
    </span>
  )
}
