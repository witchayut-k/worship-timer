import { Navigate, Route, Routes } from 'react-router-dom'
import { ServicesPage } from './pages/ServicesPage'
import { SetupPage } from './pages/SetupPage'
import { StartPage } from './pages/StartPage'
import { ViewerPage } from './pages/ViewerPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/services" replace />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/setup" element={<SetupPage mode="new" />} />
      <Route path="/setup/:eventId" element={<SetupPage mode="edit" />} />
      <Route path="/start/:eventId" element={<StartPage />} />
      <Route path="/view/:eventId" element={<ViewerPage />} />
      <Route path="*" element={<Navigate to="/services" replace />} />
    </Routes>
  )
}
