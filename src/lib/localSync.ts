import type { RuntimeState } from '../domain/types'
import { storageKeys } from './storageKeys'

function channelName(eventId: string): string {
  return storageKeys.event(eventId)
}

function storageKey(eventId: string): string {
  return storageKeys.runtime(eventId)
}

export function loadStoredLocalRuntime(eventId: string): RuntimeState | null {
  return readStoredRuntime(eventId)
}

function readStoredRuntime(eventId: string): RuntimeState | null {
  try {
    const raw = localStorage.getItem(storageKey(eventId))
    if (!raw) return null
    return JSON.parse(raw) as RuntimeState
  } catch {
    return null
  }
}

function writeStoredRuntime(eventId: string, state: RuntimeState): void {
  try {
    localStorage.setItem(storageKey(eventId), JSON.stringify(state))
  } catch {
    // ignore quota / private mode
  }
}

function isOfflineRuntimeId(eventId: string): boolean {
  return eventId.startsWith('local-') || eventId.startsWith('lib-')
}

export function publishLocalRuntime(eventId: string, state: RuntimeState): void {
  if (!isOfflineRuntimeId(eventId)) return
  writeStoredRuntime(eventId, state)
  const ch = new BroadcastChannel(channelName(eventId))
  ch.postMessage({ type: 'runtime', state })
  ch.close()
}

export function subscribeLocalRuntime(
  eventId: string,
  cb: (state: RuntimeState) => void,
): () => void {
  if (!isOfflineRuntimeId(eventId)) return () => {}

  const stored = readStoredRuntime(eventId)
  if (stored) {
    cb(stored)
  }

  const ch = new BroadcastChannel(channelName(eventId))
  ch.onmessage = (e: MessageEvent<{ type?: string; state?: RuntimeState }>) => {
    if (e.data?.type === 'runtime' && e.data.state) {
      writeStoredRuntime(eventId, e.data.state)
      cb(e.data.state)
    }
  }
  return () => ch.close()
}
