import { Outlet } from 'react-router-dom'
import { ActiveControlProvider } from './context/ActiveControlProvider'

export function AppLayout() {
  return (
    <ActiveControlProvider>
      <Outlet />
    </ActiveControlProvider>
  )
}
