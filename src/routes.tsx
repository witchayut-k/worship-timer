import { Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { PaidOnlyRoute } from './components/PaidOnlyRoute'
import { usePlan } from './context/PlanProvider'
import { ServicesPage } from './pages/ServicesPage'
import { SetupPage } from './pages/SetupPage'
import { StartPage } from './pages/StartPage'
import { ViewerPage } from './pages/ViewerPage'
import { freeSessionSetupPath } from './lib/freeSession'
import { isFreePlan } from './lib/planTier'

function HomeRedirect() {
  const { homePath } = usePlan()
  return <Navigate to={homePath} replace />
}

function FreeSetupRedirect() {
  return <Navigate to={freeSessionSetupPath()} replace />
}

const freeSetupOnly = isFreePlan()

export const appRoutes = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <HomeRedirect /> },
      {
        element: <PaidOnlyRoute />,
        children: [{ path: '/services', element: <ServicesPage /> }],
      },
      {
        path: '/setup',
        element: freeSetupOnly ? <FreeSetupRedirect /> : <SetupPage mode="new" />,
      },
      { path: '/setup/:eventId', element: <SetupPage mode="edit" /> },
      { path: '/start/:eventId', element: <StartPage /> },
      { path: '/view/:eventId', element: <ViewerPage /> },
      { path: '*', element: <HomeRedirect /> },
    ],
  },
]
