import { useCallback, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useActiveControl } from './useActiveControl'

export function useLeaveControl(productionMode: boolean) {
  const navigate = useNavigate()
  const { activeControl, clearActiveControl } = useActiveControl()
  const [manualOpen, setManualOpen] = useState(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      productionMode &&
      currentLocation.pathname !== nextLocation.pathname &&
      (nextLocation.pathname === '/services' || nextLocation.pathname === '/'),
  )

  const leaveModalOpen = manualOpen || blocker.state === 'blocked'

  const requestLeave = useCallback(() => {
    if (!productionMode) {
      navigate('/services')
      return
    }
    setManualOpen(true)
  }, [productionMode, navigate])

  const confirmLeave = useCallback(() => {
    const wasBlocked = blocker.state === 'blocked'
    clearActiveControl()
    setManualOpen(false)
    if (wasBlocked) {
      blocker.proceed?.()
    } else {
      navigate('/services')
    }
  }, [blocker, clearActiveControl, navigate])

  const cancelLeave = useCallback(() => {
    setManualOpen(false)
    if (blocker.state === 'blocked') {
      blocker.reset?.()
    }
  }, [blocker])

  return {
    leaveModalOpen,
    leaveModalTitle: activeControl?.title ?? 'Worship Timer',
    requestLeave,
    confirmLeave,
    cancelLeave,
  }
}
