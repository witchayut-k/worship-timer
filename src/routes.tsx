import { Navigate } from 'react-router-dom'
import { AppLayout } from './AppLayout'
import { ServicesPage } from './pages/ServicesPage'
import { SetupPage } from './pages/SetupPage'
import { StartPage } from './pages/StartPage'
import { ViewerPage } from './pages/ViewerPage'

export const appRoutes = [
  {
    element: <AppLayout />,
    children: [
      { path: '/', element: <Navigate to="/services" replace /> },
      { path: '/services', element: <ServicesPage /> },
      { path: '/setup', element: <SetupPage mode="new" /> },
      { path: '/setup/:eventId', element: <SetupPage mode="edit" /> },
      { path: '/start/:eventId', element: <StartPage /> },
      { path: '/view/:eventId', element: <ViewerPage /> },
      { path: '*', element: <Navigate to="/services" replace /> },
    ],
  },
]
