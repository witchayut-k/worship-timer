import type { LiveMessage, ProgramItem, RuntimePhase, RuntimeState } from '../domain/types'
import { MANUAL_FLASH_DURATION_MS } from '../domain/stageOutput'
import { clampInt } from '../domain/time'

export type RuntimeAction =
  | { type: 'start'; nowMs: number; items?: ProgramItem[]; uid?: string | null }
  | { type: 'pause'; nowMs: number; uid?: string | null }
  | { type: 'resetCurrent'; nowMs: number; items: ProgramItem[]; uid?: string | null }
  | {
      type: 'jumpTo'
      nowMs: number
      index: number
      items: ProgramItem[]
      autoStart?: boolean
      uid?: string | null
    }
  | { type: 'adjust'; nowMs: number; deltaSec: number; uid?: string | null }
  | { type: 'setRemaining'; nowMs: number; remainingSec: number; uid?: string | null }
  | { type: 'setBlackout'; nowMs: number; enabled: boolean; uid?: string | null }
  | { type: 'triggerManualFlash'; nowMs: number; uid?: string | null }
  | { type: 'endService'; nowMs: number; uid?: string | null }
  | { type: 'setLiveMessage'; nowMs: number; text: string; uid?: string | null }
  | { type: 'clearLiveMessage'; nowMs: number; uid?: string | null }
  | { type: 'hydrate'; state: RuntimeState }

function normalizeActiveMessage(raw: LiveMessage | null | undefined): LiveMessage | null {
  if (!raw || typeof raw.text !== 'string') return null
  const text = raw.text.trim()
  if (!text) return null
  return {
    text,
    sentAtMs: typeof raw.sentAtMs === 'number' ? raw.sentAtMs : 0,
  }
}

export function normalizeRuntimeState(state: RuntimeState): RuntimeState {
  return {
    ...state,
    blackout: state.blackout ?? false,
    manualFlashUntilMs: state.manualFlashUntilMs ?? null,
    serviceEnded: state.serviceEnded ?? false,
    activeMessage: normalizeActiveMessage(state.activeMessage),
  }
}

export function tickRemainingSec(params: { state: RuntimeState; nowMs: number }): number {
  const { state, nowMs } = params
  if (state.phase !== 'running') return state.remainingSec
  if (state.startedAtMs == null) return state.remainingSec
  const elapsed = (nowMs - state.startedAtMs) / 1000
  return Math.trunc(state.remainingSec - elapsed)
}

export function clampRuntimeIndex(state: RuntimeState, items: ProgramItem[]): RuntimeState {
  if (items.length === 0) return state
  const maxIdx = items.length - 1
  if (state.currentIndex >= 0 && state.currentIndex <= maxIdx) return state

  const idx = clampInt(state.currentIndex, 0, maxIdx)
  const next: RuntimeState = {
    ...state,
    currentIndex: idx,
    remainingSec: items[idx]?.durationSec ?? 0,
  }
  if (state.phase === 'running') {
    return {
      ...next,
      phase: 'stopped',
      startedAtMs: null,
    }
  }
  return next
}

export function initialRuntimeState(params: { items: ProgramItem[]; uid?: string | null }): RuntimeState {
  const first = params.items[0]
  const nowMs = Date.now()
  return {
    currentIndex: 0,
    phase: 'stopped',
    startedAtMs: null,
    remainingSec: first?.durationSec ?? 0,
    lastTickAtMs: nowMs,
    version: 1,
    updatedByUid: params.uid ?? null,
    blackout: false,
    manualFlashUntilMs: null,
    serviceEnded: false,
    activeMessage: null,
  }
}

export function reduceRuntimeState(prev: RuntimeState, action: RuntimeAction): RuntimeState {
  if (action.type === 'hydrate') {
    const incoming = normalizeRuntimeState(action.state)
    if (incoming.version < prev.version) return prev
    return incoming
  }

  const base: RuntimeState = {
    ...prev,
    lastTickAtMs: action.nowMs,
    version: prev.version + 1,
    updatedByUid: action.uid ?? prev.updatedByUid ?? null,
  }

  const clearStageOutput = {
    blackout: false,
    manualFlashUntilMs: null as number | null,
    serviceEnded: false,
  }

  switch (action.type) {
    case 'start': {
      if (prev.phase === 'running') return prev
      if (prev.serviceEnded && action.items && action.items.length > 0) {
        return {
          ...base,
          ...clearStageOutput,
          currentIndex: 0,
          phase: 'running',
          startedAtMs: action.nowMs,
          remainingSec: action.items[0]?.durationSec ?? 0,
        }
      }
      return {
        ...base,
        ...clearStageOutput,
        phase: 'running',
        startedAtMs: action.nowMs,
      }
    }
    case 'pause': {
      if (prev.phase !== 'running') return prev
      const currentRemaining = tickRemainingSec({ state: prev, nowMs: action.nowMs })
      return {
        ...base,
        phase: 'paused',
        startedAtMs: null,
        remainingSec: currentRemaining,
      }
    }
    case 'resetCurrent': {
      const dur = action.items[prev.currentIndex]?.durationSec ?? 0
      return {
        ...base,
        ...clearStageOutput,
        phase: 'stopped',
        startedAtMs: null,
        remainingSec: dur,
      }
    }
    case 'jumpTo': {
      const idx = clampInt(action.index, 0, Math.max(0, action.items.length - 1))
      const dur = action.items[idx]?.durationSec ?? 0
      const autoStart = action.autoStart === true
      return {
        ...base,
        ...clearStageOutput,
        currentIndex: idx,
        phase: autoStart ? 'running' : 'stopped',
        startedAtMs: autoStart ? action.nowMs : null,
        remainingSec: dur,
      }
    }
    case 'adjust': {
      const currentRemaining =
        prev.phase === 'running' ? tickRemainingSec({ state: prev, nowMs: action.nowMs }) : prev.remainingSec
      const next = clampInt(currentRemaining + action.deltaSec, -99 * 60, 99 * 60)
      return {
        ...base,
        remainingSec: next,
        startedAtMs: prev.phase === 'running' ? action.nowMs : prev.startedAtMs,
      }
    }
    case 'setRemaining': {
      const next = clampInt(action.remainingSec, -99 * 60, 99 * 60)
      return {
        ...base,
        phase: 'stopped',
        startedAtMs: null,
        remainingSec: next,
      }
    }
    case 'setBlackout': {
      return {
        ...base,
        blackout: action.enabled,
      }
    }
    case 'triggerManualFlash': {
      return {
        ...base,
        manualFlashUntilMs: action.nowMs + MANUAL_FLASH_DURATION_MS,
      }
    }
    case 'endService': {
      return {
        ...base,
        phase: 'stopped',
        startedAtMs: null,
        remainingSec: 0,
        blackout: true,
        serviceEnded: true,
        manualFlashUntilMs: null,
      }
    }
    case 'setLiveMessage': {
      const text = action.text.trim()
      if (!text) return prev
      return {
        ...base,
        activeMessage: { text, sentAtMs: action.nowMs },
      }
    }
    case 'clearLiveMessage': {
      if (prev.activeMessage == null) return prev
      return {
        ...base,
        activeMessage: null,
      }
    }
  }
}

export function deriveLocalDisplay(params: { state: RuntimeState; nowMs: number }) {
  const { state, nowMs } = params
  const remainingSec = tickRemainingSec({ state, nowMs })
  const over = remainingSec < 0
  return { remainingSec, over }
}

export function normalizePhase(phase: RuntimePhase): RuntimePhase {
  return phase
}
