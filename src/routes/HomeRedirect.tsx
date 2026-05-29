import { Navigate } from 'react-router-dom'
import { usePlan } from '../hooks/usePlan'

export function HomeRedirect() {
  const { homePath } = usePlan()
  return <Navigate to={homePath} replace />
}
