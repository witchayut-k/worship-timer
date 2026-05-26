import { useCallback, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { useActiveControl } from './useActiveControl'

export function useLeaveControl(productionMode: boolean) {
  const navigate = useNavigate()
  const { activeControl, endActiveControl } = useActiveControl()
  const [manualOpen, setManualOpen] = useState(false)
  const bypassBlockerRef = useRef(false)

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => {
      if (bypassBlockerRef.current) return false
      return (
        productionMode &&
        currentLocation.pathname !== nextLocation.pathname &&
        (nextLocation.pathname === '/services' || nextLocation.pathname === '/')
      )
    },
  )

  const leaveModalOpen = manualOpen || blocker.state === 'blocked'

  const requestLeave = useCallback(() => {
    if (!productionMode) {
      navigate('/services')
      return
    }
    setManualOpen(true)
  }, [productionMode, navigate])

  const goToServices = useCallback(() => {
    setManualOpen(false)
    if (blocker.state === 'blocked') {
      blocker.proceed?.()
      return
    }
    bypassBlockerRef.current = true
    navigate('/services')
    bypassBlockerRef.current = false
  }, [blocker, navigate])

  const confirmGoToServices = useCallback(() => {
    goToServices()
  }, [goToServices])

  const endControlAndLeave = useCallback(() => {
    void endActiveControl().finally(() => {
      goToServices()
    })
  }, [endActiveControl, goToServices])

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
    confirmGoToServices,
    endControlAndLeave,
    cancelLeave,
  }
}
