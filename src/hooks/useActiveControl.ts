import { useContext } from 'react'
import { ActiveControlContext } from '../context/activeControlContext'

export function useActiveControl() {
  const ctx = useContext(ActiveControlContext)
  if (!ctx) {
    throw new Error('useActiveControl must be used within ActiveControlProvider')
  }
  return ctx
}
