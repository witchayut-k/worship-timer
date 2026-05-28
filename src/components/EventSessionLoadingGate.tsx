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
  const location = useLocation()
  const setupMatch = useMatch('/setup/:eventId')
  const route = setupMatch ? 'setup' : 'start'

  const loading = isEventWorkspaceBootLoading(
    authReady,
    session.status,
    session.hasSetupDraft,
    route,
  )

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-6',hypothesisId:'H14',location:'EventSessionLoadingGate.tsx:routeEval',message:'loading gate route evaluation',data:{pathname:location.pathname,route,loading,sessionStatus:session.status,authReady,hasSetupDraft:session.hasSetupDraft()},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [location.pathname, route, loading, session.status, authReady, session])

  if (loading) {
    return <FullScreenLoading message={t('setup.loadingProgram')} />
  }

  return children
}
