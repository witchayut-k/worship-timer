import { Outlet } from 'react-router-dom'
import { ActiveControlProvider } from './context/ActiveControlProvider'
import { PlanProvider } from './context/PlanProvider'

export function AppLayout() {
  return (
    <PlanProvider>
      <ActiveControlProvider>
        <Outlet />
      </ActiveControlProvider>
    </PlanProvider>
  )
}
