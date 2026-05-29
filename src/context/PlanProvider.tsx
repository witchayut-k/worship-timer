import { useMemo, type ReactNode } from 'react'
import { sessionRoomSetupPath } from '../lib/freeSession'
import { getPlanTier, isPaidPlan } from '../lib/planTier'
import { PlanContext, type PlanContextValue } from './planContext'

export function PlanProvider({ children }: { children: ReactNode }) {
  const value = useMemo<PlanContextValue>(() => {
    const tier = getPlanTier()
    const isPaid = isPaidPlan()
    const homePath = isPaid ? '/services' : sessionRoomSetupPath()
    return {
      tier,
      isPaid,
      isFree: !isPaid,
      homePath,
    }
  }, [])

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}
