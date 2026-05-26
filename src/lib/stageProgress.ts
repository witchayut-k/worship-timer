export type RingDash = {
  circumference: number
  dashArray: string
  dashOffset: number
  remainingRatio: number
}

export function computeRingDash(params: {
  remainingSec: number
  durationSec: number
  radius?: number
}): RingDash {
  const radius = params.radius ?? 200
  const circumference = 2 * Math.PI * radius
  const duration = Math.max(0, params.durationSec)

  let remainingRatio = 1
  if (params.remainingSec < 0) {
    remainingRatio = 1
  } else if (duration > 0) {
    remainingRatio = Math.max(0, Math.min(1, params.remainingSec / duration))
  }

  const visibleLength = circumference * remainingRatio
  const dashArray = `${visibleLength} ${circumference}`
  const dashOffset = 0

  return {
    circumference,
    dashArray,
    dashOffset,
    remainingRatio,
  }
}
