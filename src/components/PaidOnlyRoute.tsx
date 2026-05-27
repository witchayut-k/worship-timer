import { Navigate, Outlet } from 'react-router-dom'
import { usePlan } from '../context/PlanProvider'

/** Renders child routes only on Paid plan; Free users go to single-session setup. */
export function PaidOnlyRoute() {
  const { homePath, isFree } = usePlan()
  if (isFree) return <Navigate to={homePath} replace />
  return <Outlet />
}
