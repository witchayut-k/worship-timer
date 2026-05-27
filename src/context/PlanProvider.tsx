import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { sessionRoomSetupPath } from '../lib/freeSession'
import { getPlanTier, isPaidPlan, type PlanTier } from '../lib/planTier'

type PlanContextValue = {
  tier: PlanTier
  isPaid: boolean
  isFree: boolean
  homePath: string
}

const PlanContext = createContext<PlanContextValue | null>(null)

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

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used within PlanProvider')
  return ctx
}
