import { type ReactNode } from 'react'
import { useMatch } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useEventSession } from '../hooks/useEventSession'
import { useLocale } from '../i18n/useLocale'
import { isEventWorkspaceBootLoading } from '../lib/eventSessionLoading'
import { FullScreenLoading } from './FullScreenLoading'

type Props = {
  children: ReactNode
}

export function EventSessionLoadingGate({ children }: Props) {
  const { t } = useLocale()
  const { ready: authReady } = useAuth()
  const session = useEventSession()
  const setupMatch = useMatch('/setup/:eventId')
  const route = setupMatch ? 'setup' : 'start'

  const loading = isEventWorkspaceBootLoading(
    authReady,
    session.status,
    session.hasSetupDraft,
    route,
  )

  if (loading) {
    return <FullScreenLoading message={t('setup.loadingProgram')} />
  }

  return children
}
