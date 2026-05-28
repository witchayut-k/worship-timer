import { Outlet, useLocation, useMatch } from 'react-router-dom'
import { Component, useEffect } from 'react'
import type { ReactNode } from 'react'
import { EventSessionLoadingGate } from '../components/EventSessionLoadingGate'
import { EventSessionProvider } from '../context/EventSessionProvider'
import { EventWorkspaceRuntimeProvider } from '../context/EventWorkspaceRuntimeContext'

class WorkspaceErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    // #region agent log
    fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-6',hypothesisId:'H13',location:'EventWorkspaceLayout.tsx:ErrorBoundary',message:'workspace render error captured',data:{error:error.message},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  render() {
    if (this.state.hasError) return null
    return this.props.children
  }
}

export function EventWorkspaceLayout() {
  const location = useLocation()
  const setupMatch = useMatch('/setup/:eventId')
  const startMatch = useMatch('/start/:eventId')
  const eventId = setupMatch?.params.eventId ?? startMatch?.params.eventId
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-1',hypothesisId:'H5',location:'EventWorkspaceLayout.tsx:routeMatch',message:'workspace route match update',data:{setupEventId:setupMatch?.params.eventId??null,startEventId:startMatch?.params.eventId??null,eventId:eventId??null},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [setupMatch?.params.eventId, startMatch?.params.eventId, eventId])
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-2',hypothesisId:'H6',location:'EventWorkspaceLayout.tsx:location',message:'workspace location changed',data:{pathname:location.pathname,search:location.search,eventId:eventId??null,setupMatch:Boolean(setupMatch),startMatch:Boolean(startMatch)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [location.pathname, location.search, eventId, setupMatch, startMatch])

  if (!eventId) {
    return <Outlet />
  }

  return (
    <WorkspaceErrorBoundary>
      <EventSessionProvider eventId={eventId}>
        <EventSessionLoadingGate>
          <EventWorkspaceRuntimeProvider eventId={eventId}>
            <Outlet />
          </EventWorkspaceRuntimeProvider>
        </EventSessionLoadingGate>
      </EventSessionProvider>
    </WorkspaceErrorBoundary>
  )
}
