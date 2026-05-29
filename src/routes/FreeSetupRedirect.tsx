import { Navigate } from 'react-router-dom'
import { sessionRoomSetupPath } from '../lib/freeSession'

export function FreeSetupRedirect() {
  return <Navigate to={sessionRoomSetupPath()} replace />
}
