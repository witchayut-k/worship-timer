import { createContext } from 'react'
import type { PlanTier } from '../lib/planTier'

export type PlanContextValue = {
  tier: PlanTier
  isPaid: boolean
  isFree: boolean
  homePath: string
  showUpgradeCta: boolean
}

export const PlanContext = createContext<PlanContextValue | null>(null)
