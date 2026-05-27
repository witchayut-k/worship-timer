import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { freeSessionSetupPath, FREE_SESSION_ID } from '../lib/freeSession'
import { getPlanTier, isPaidPlan, type PlanTier } from '../lib/planTier'

type PlanContextValue = {
  tier: PlanTier
  isPaid: boolean
  isFree: boolean
  freeSessionId: string
  homePath: string
}

const PlanContext = createContext<PlanContextValue | null>(null)

export function PlanProvider({ children }: { children: ReactNode }) {
  const value = useMemo<PlanContextValue>(() => {
    const tier = getPlanTier()
    const isPaid = isPaidPlan()
    return {
      tier,
      isPaid,
      isFree: !isPaid,
      freeSessionId: FREE_SESSION_ID,
      homePath: isPaid ? '/services' : freeSessionSetupPath(),
    }
  }, [])

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext)
  if (!ctx) throw new Error('usePlan must be used within PlanProvider')
  return ctx
}
