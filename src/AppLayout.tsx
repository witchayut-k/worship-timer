import { Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { ActiveControlProvider } from './context/ActiveControlProvider'
import { PlanProvider } from './context/PlanProvider'

export function AppLayout() {
  const location = useLocation()
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-2',hypothesisId:'H7',location:'AppLayout.tsx:location',message:'app layout location changed',data:{pathname:location.pathname,search:location.search},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [location.pathname, location.search])

  return (
    <PlanProvider>
      <ActiveControlProvider>
        <Outlet />
      </ActiveControlProvider>
    </PlanProvider>
  )
}
