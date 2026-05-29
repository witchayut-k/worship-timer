import { useCallback, useRef, useState } from 'react'
import { useBlocker, useNavigate } from 'react-router-dom'
import { usePlan } from './usePlan'
import { getStoredLocale, translate } from '../i18n/translate'
import { useActiveControl } from './useActiveControl'

export function useLeaveControl(productionMode: boolean) {
  const navigate = useNavigate()
  const { isFree, homePath } = usePlan()
  const libraryPath = isFree ? homePath : '/services'
  const { activeControl, endActiveControl } = useActiveControl()
  const [manualOpen, setManualOpen] = useState(false)
  const bypassBlockerRef = useRef(false)

  const isLibraryLeaveTarget = useCallback(
    (pathname: string) => {
      if (isFree) {
        return pathname === homePath || pathname === '/' || pathname.startsWith('/setup')
      }
      return pathname === '/services' || pathname === '/'
    },
    [isFree, homePath],
  )

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (isFree) return false
    if (bypassBlockerRef.current) return false
    return (
      productionMode &&
      currentLocation.pathname !== nextLocation.pathname &&
      isLibraryLeaveTarget(nextLocation.pathname)
    )
  })

  const leaveModalOpen = manualOpen || blocker.state === 'blocked'

  const requestLeave = useCallback(() => {
    if (!productionMode || isFree) {
      navigate(libraryPath)
      return
    }
    setManualOpen(true)
  }, [productionMode, isFree, navigate, libraryPath])

  const goToLibrary = useCallback(() => {
    setManualOpen(false)
    if (blocker.state === 'blocked') {
      blocker.proceed?.()
      return
    }
    bypassBlockerRef.current = true
    navigate(libraryPath)
    bypassBlockerRef.current = false
  }, [blocker, navigate, libraryPath])

  const confirmGoToLibrary = useCallback(() => {
    goToLibrary()
  }, [goToLibrary])

  const endControlAndLeave = useCallback(() => {
    void endActiveControl().finally(() => {
      goToLibrary()
    })
  }, [endActiveControl, goToLibrary])

  const cancelLeave = useCallback(() => {
    setManualOpen(false)
    if (blocker.state === 'blocked') {
      blocker.reset?.()
    }
  }, [blocker])

  return {
    leaveModalOpen,
    leaveModalTitle: activeControl?.title?.trim() || translate('event.untitled', getStoredLocale()),
    requestLeave,
    confirmGoToLibrary,
    endControlAndLeave,
    cancelLeave,
    leaveDestinationKey: isFree ? ('modal.goToSetup' as const) : ('modal.goToServices' as const),
  }
}
