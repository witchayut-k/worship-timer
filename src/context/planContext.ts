import { createContext } from 'react'
import type { PlanTier } from '../lib/planTier'

export type PlanContextValue = {
  tier: PlanTier
  isPaid: boolean
  isFree: boolean
  homePath: string
}

export const PlanContext = createContext<PlanContextValue | null>(null)
