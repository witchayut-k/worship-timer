import { Navigate, Route, Routes } from 'react-router-dom'
import { SetupPage } from './pages/SetupPage'
import { StartPage } from './pages/StartPage'
import { ViewerPage } from './pages/ViewerPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/setup" replace />} />
      <Route path="/setup" element={<SetupPage />} />
      <Route path="/start/:eventId" element={<StartPage />} />
      <Route path="/view/:eventId" element={<ViewerPage />} />
      <Route path="*" element={<Navigate to="/setup" replace />} />
    </Routes>
  )
}
