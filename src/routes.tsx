import { AppLayout } from './AppLayout'
import { PaidOnlyRoute } from './components/PaidOnlyRoute'
import { EventWorkspaceLayout } from './layout/EventWorkspaceLayout'
import { ServicesPage } from './pages/ServicesPage'
import { SetupPage } from './pages/SetupPage'
import { StartPage } from './pages/StartPage'
import { CrewPage } from './pages/CrewPage'
import { ViewerPage } from './pages/ViewerPage'
import { isFreePlan } from './lib/planTier'
import { FreeSetupRedirect } from './routes/FreeSetupRedirect'
import { HomeRedirect } from './routes/HomeRedirect'

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
      {
        element: <EventWorkspaceLayout />,
        children: [
          { path: '/setup/:eventId', element: <SetupPage mode="edit" /> },
          { path: '/start/:eventId', element: <StartPage /> },
        ],
      },
      { path: '/view/:eventId', element: <ViewerPage /> },
      { path: '/crew/:eventId', element: <CrewPage /> },
      { path: '*', element: <HomeRedirect /> },
    ],
  },
]
