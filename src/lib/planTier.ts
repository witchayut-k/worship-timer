export type PlanTier = 'free' | 'paid'

const VALID: PlanTier[] = ['free', 'paid']

export function getPlanTier(): PlanTier {
  const raw = import.meta.env.VITE_PLAN_TIER?.trim().toLowerCase()
  if (raw && VALID.includes(raw as PlanTier)) return raw as PlanTier
  return 'free'
}

export function isPaidPlan(): boolean {
  return getPlanTier() === 'paid'
}

export function isFreePlan(): boolean {
  return !isPaidPlan()
}
