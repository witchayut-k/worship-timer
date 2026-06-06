import type { ProgramItem, RuntimeState, WorshipEvent } from '../domain/types'
import { upsertEventProgram, upsertEventWithItems } from './firestoreRepo'

export type WorkspaceSyncStatus = 'localOnly' | 'pending' | 'syncing' | 'synced' | 'error'

export type WorkspaceSyncSnapshot = {
  status: WorkspaceSyncStatus
  localRevision: number
  cloudRevision: number
  lastError: string | null
}

export type WorkspaceSyncPayload = {
  event: WorshipEvent
  items: ProgramItem[]
  revision: number
}

export type EnqueueSyncOptions = {
  touchRuntime?: boolean
  initialState?: RuntimeState
}

type QueueEntry = {
  payload: WorkspaceSyncPayload
  options: EnqueueSyncOptions
}

type EventQueueState = {
  localRevision: number
  cloudRevision: number
  status: WorkspaceSyncStatus
  lastError: string | null
  debounceTimer: ReturnType<typeof setTimeout> | null
  inFlight: Promise<void> | null
  pending: QueueEntry | null
  listeners: Set<(snap: WorkspaceSyncSnapshot) => void>
}

const DEBOUNCE_MS = 1000

const queues = new Map<string, EventQueueState>()

function getQueue(eventId: string): EventQueueState {
  let q = queues.get(eventId)
  if (!q) {
    q = {
      localRevision: 0,
      cloudRevision: 0,
      status: 'localOnly',
      lastError: null,
      debounceTimer: null,
      inFlight: null,
      pending: null,
      listeners: new Set(),
    }
    queues.set(eventId, q)
  }
  return q
}

function snapshot(eventId: string): WorkspaceSyncSnapshot {
  const q = getQueue(eventId)
  return {
    status: q.status,
    localRevision: q.localRevision,
    cloudRevision: q.cloudRevision,
    lastError: q.lastError,
  }
}

function emit(eventId: string): void {
  const snap = snapshot(eventId)
  for (const cb of getQueue(eventId).listeners) {
    cb(snap)
  }
}

function deriveStatus(q: EventQueueState): WorkspaceSyncStatus {
  if (q.lastError && q.localRevision > q.cloudRevision) return 'error'
  if (q.inFlight || q.pending || q.debounceTimer) {
    if (q.localRevision > q.cloudRevision) return q.inFlight ? 'syncing' : 'pending'
  }
  if (q.cloudRevision > 0 || q.localRevision > 0) return 'synced'
  return 'localOnly'
}

/** After direct Firestore save (bypassing workspace enqueue), clear stale pending state. */
export function acknowledgeDirectCloudSave(
  eventId: string,
  revision?: number,
  cloudEnabled = true,
): void {
  const q = getQueue(eventId)
  if (revision != null && revision > 0) {
    q.localRevision = Math.max(q.localRevision, revision)
    if (cloudEnabled) {
      q.cloudRevision = Math.max(q.cloudRevision, revision)
    }
  } else if (q.localRevision > 0 && cloudEnabled) {
    q.cloudRevision = q.localRevision
  }
  q.pending = null
  if (q.debounceTimer) {
    clearTimeout(q.debounceTimer)
    q.debounceTimer = null
  }
  q.lastError = null
  if (!cloudEnabled) {
    q.status = 'localOnly'
    emit(eventId)
    return
  }
  refreshStatus(eventId)
}

function refreshStatus(eventId: string): void {
  const q = getQueue(eventId)
  q.status = deriveStatus(q)
  emit(eventId)
}

export function subscribeWorkspaceSync(
  eventId: string,
  cb: (snap: WorkspaceSyncSnapshot) => void,
): () => void {
  const q = getQueue(eventId)
  q.listeners.add(cb)
  cb(snapshot(eventId))
  return () => {
    q.listeners.delete(cb)
  }
}

export function getWorkspaceSyncSnapshot(eventId: string): WorkspaceSyncSnapshot {
  return snapshot(eventId)
}

export function noteLocalRevision(eventId: string, revision: number, cloudEnabled: boolean): void {
  const q = getQueue(eventId)
  q.localRevision = Math.max(q.localRevision, revision)
  if (!cloudEnabled) {
    q.status = 'localOnly'
    q.lastError = null
    emit(eventId)
    return
  }
  refreshStatus(eventId)
}

export function enqueueWorkspaceSync(
  eventId: string,
  payload: WorkspaceSyncPayload,
  options: EnqueueSyncOptions,
  cloudEnabled: boolean,
): void {
  noteLocalRevision(eventId, payload.revision, cloudEnabled)
  if (!cloudEnabled) return

  const q = getQueue(eventId)
  q.pending = { payload, options }
  q.lastError = null

  if (q.debounceTimer) {
    clearTimeout(q.debounceTimer)
  }

  q.debounceTimer = setTimeout(() => {
    q.debounceTimer = null
    void drainQueue(eventId)
  }, DEBOUNCE_MS)

  refreshStatus(eventId)
}

async function runSync(eventId: string, entry: QueueEntry): Promise<void> {
  const { payload, options } = entry
  if (options.touchRuntime && options.initialState) {
    await upsertEventWithItems({
      eventId,
      event: payload.event,
      items: payload.items,
      initialState: options.initialState,
    })
  } else {
    await upsertEventProgram({
      eventId,
      event: payload.event,
      items: payload.items,
    })
  }
}

async function drainQueue(eventId: string): Promise<void> {
  const q = getQueue(eventId)

  if (q.inFlight) {
    await q.inFlight
    return drainQueue(eventId)
  }

  if (!q.pending) return

  const entry = q.pending
  q.pending = null
  q.status = 'syncing'
  emit(eventId)

  const writtenRevision = entry.payload.revision

  const job = (async () => {
    try {
      await runSync(eventId, entry)
      const qq = getQueue(eventId)
      if (writtenRevision >= qq.cloudRevision) {
        qq.cloudRevision = writtenRevision
      }
      qq.lastError = null
    } catch (e) {
      const qq = getQueue(eventId)
      qq.lastError = e instanceof Error ? e.message : 'Sync failed'
    } finally {
      const qq = getQueue(eventId)
      qq.inFlight = null
      refreshStatus(eventId)
      if (qq.pending) {
        void drainQueue(eventId)
      }
    }
  })()

  q.inFlight = job
  await job
}

export async function flushWorkspaceSync(eventId: string): Promise<WorkspaceSyncSnapshot> {
  const q = getQueue(eventId)
  if (q.debounceTimer) {
    clearTimeout(q.debounceTimer)
    q.debounceTimer = null
  }
  while (q.pending || q.inFlight) {
    await drainQueue(eventId)
    if (q.inFlight) {
      await q.inFlight
    }
  }
  refreshStatus(eventId)
  return snapshot(eventId)
}

export function resetWorkspaceSyncForTests(eventId?: string): void {
  if (eventId) {
    const q = queues.get(eventId)
    if (q?.debounceTimer) clearTimeout(q.debounceTimer)
    queues.delete(eventId)
    return
  }
  for (const [, q] of queues) {
    if (q.debounceTimer) clearTimeout(q.debounceTimer)
  }
  queues.clear()
}

/** @internal test hook */
export function __testSetCloudRevision(eventId: string, revision: number): void {
  getQueue(eventId).cloudRevision = revision
}
