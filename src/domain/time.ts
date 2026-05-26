export function clampInt(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  const x = Math.trunc(n)
  return Math.min(max, Math.max(min, x))
}

export function formatSecToMmSs(totalSeconds: number): string {
  const sec = Math.max(0, Math.trunc(totalSeconds))
  const mm = Math.floor(sec / 60)
  const ss = sec % 60
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function formatSecToHhMmSs(totalSeconds: number): string {
  const sec = Math.max(0, Math.trunc(totalSeconds))
  const hh = Math.floor(sec / 3600)
  const mm = Math.floor((sec % 3600) / 60)
  const ss = sec % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function parseMmSsToSec(input: string): number | null {
  const trimmed = input.trim()
  if (!trimmed) return 0
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (!match) return null
  const mm = Number(match[1])
  const ss = Number(match[2])
  if (!Number.isFinite(mm) || !Number.isFinite(ss) || ss > 59) return null
  return mm * 60 + ss
}

export function formatSignedMMSS(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : ''
  const abs = Math.abs(Math.trunc(totalSeconds))
  const mm = Math.floor(abs / 60)
  const ss = abs % 60
  return `${sign}${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

export function computeRemainingSec(params: {
  phase: 'running' | 'paused' | 'stopped'
  startedAtMs: number | null
  remainingSec: number
  nowMs: number
}): number {
  const { phase, startedAtMs, remainingSec, nowMs } = params
  if (phase !== 'running') return remainingSec
  if (startedAtMs == null) return remainingSec
  const elapsedSec = (nowMs - startedAtMs) / 1000
  return Math.trunc(remainingSec - elapsedSec)
}

