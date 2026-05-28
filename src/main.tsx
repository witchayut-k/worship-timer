import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { LocaleProvider } from './i18n/LocaleProvider'
import { appRoutes } from './routes'
import './index.css'
import './styles/stage/index.scss'

const router = createBrowserRouter(appRoutes)

// #region agent log
if (typeof window !== 'undefined') {
  router.subscribe((state) => {
    fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-4',hypothesisId:'H10',location:'main.tsx:routerSubscribe',message:'router state update',data:{routerPathname:state.location.pathname,browserPathname:window.location.pathname,navigationState:state.navigation.state},timestamp:Date.now()})}).catch(()=>{});
  })
  window.addEventListener('popstate', () => {
    fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-4',hypothesisId:'H10',location:'main.tsx:popstate',message:'window popstate fired',data:{browserPathname:window.location.pathname},timestamp:Date.now()})}).catch(()=>{});
  })
  window.addEventListener('error', (event) => {
    fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-5',hypothesisId:'H12',location:'main.tsx:windowError',message:'window error event',data:{message:event.message,filename:event.filename,lineno:event.lineno,colno:event.colno},timestamp:Date.now()})}).catch(()=>{});
  })
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason instanceof Error ? event.reason.message : String(event.reason)
    fetch('http://127.0.0.1:7911/ingest/ade2f5ed-8b4a-4f68-b283-300d7f0a4588',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'a6ed48'},body:JSON.stringify({sessionId:'a6ed48',runId:'control-nav-debug-5',hypothesisId:'H12',location:'main.tsx:unhandledRejection',message:'window unhandled rejection',data:{reason},timestamp:Date.now()})}).catch(()=>{});
  })
}
// #endregion

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LocaleProvider>
      <RouterProvider router={router} />
    </LocaleProvider>
  </StrictMode>,
)
