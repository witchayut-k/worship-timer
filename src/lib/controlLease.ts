import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
  updateDoc,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore'
import type { ControlLease } from '../domain/types'
import { getDb } from './firebase'
import { controlLeaseDoc } from './firestorePaths'
import { storageKeys } from './storageKeys'

export const LEASE_TTL_MS = 45_000
export const HEARTBEAT_INTERVAL_MS = 15_000

export type LeaseClaimOutcome = 'claimed' | 'held' | 'observer'

function assertLease(data: DocumentData | undefined): ControlLease | null {
  if (!data) return null
  const holderUid = data.holderUid
  const holderSessionId = data.holderSessionId
  const claimedAtMs = data.claimedAtMs
  const heartbeatAtMs = data.heartbeatAtMs
  if (
    typeof holderUid !== 'string' ||
    typeof holderSessionId !== 'string' ||
    typeof claimedAtMs !== 'number' ||
    typeof heartbeatAtMs !== 'number'
  ) {
    return null
  }
  return { holderUid, holderSessionId, claimedAtMs, heartbeatAtMs }
}

export function isLeaseExpired(lease: ControlLease, nowMs: number): boolean {
  return nowMs - lease.heartbeatAtMs > LEASE_TTL_MS
}

export function isLeaseHolder(
  lease: ControlLease,
  uid: string,
  sessionId: string,
  nowMs: number,
): boolean {
  if (isLeaseExpired(lease, nowMs)) return false
  return lease.holderUid === uid && lease.holderSessionId === sessionId
}

/** Pure decision for claim transaction (unit-tested). */
export function resolveLeaseClaimOutcome(
  lease: ControlLease | null,
  uid: string,
  sessionId: string,
  nowMs: number,
): LeaseClaimOutcome {
  if (!lease || isLeaseExpired(lease, nowMs)) return 'claimed'
  if (isLeaseHolder(lease, uid, sessionId, nowMs)) return 'held'
  return 'observer'
}

function buildLease(uid: string, sessionId: string, nowMs: number): ControlLease {
  return {
    holderUid: uid,
    holderSessionId: sessionId,
    claimedAtMs: nowMs,
    heartbeatAtMs: nowMs,
  }
}

export function getOrCreateControlLeaseSessionId(eventId: string): string {
  const key = storageKeys.controlLeaseSession(eventId)
  try {
    const existing = sessionStorage.getItem(key)
    if (existing?.trim()) return existing
    const next =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `sess-${Math.random().toString(36).slice(2, 12)}`
    sessionStorage.setItem(key, next)
    return next
  } catch {
    return `sess-${Math.random().toString(36).slice(2, 12)}`
  }
}

export function watchControlLease(
  eventId: string,
  cb: (lease: ControlLease | null) => void,
): Unsubscribe {
  const db = getDb()
  return onSnapshot(doc(db, controlLeaseDoc(eventId)), (snap) => {
    cb(snap.exists() ? assertLease(snap.data()) : null)
  })
}

export async function claimControlLease(
  eventId: string,
  uid: string,
  sessionId: string,
): Promise<LeaseClaimOutcome> {
  const db = getDb()
  const ref = doc(db, controlLeaseDoc(eventId))
  const nowMs = Date.now()

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref)
    const existing = snap.exists() ? assertLease(snap.data()) : null
    const outcome = resolveLeaseClaimOutcome(existing, uid, sessionId, nowMs)

    if (outcome === 'observer') return outcome

    if (outcome === 'held' && existing) {
      tx.set(ref, { ...existing, heartbeatAtMs: nowMs })
      return 'held'
    }

    tx.set(ref, buildLease(uid, sessionId, nowMs))
    return 'claimed'
  })
}

export async function takeoverControlLease(
  eventId: string,
  uid: string,
  sessionId: string,
): Promise<void> {
  const db = getDb()
  const ref = doc(db, controlLeaseDoc(eventId))
  const nowMs = Date.now()
  await setDoc(ref, buildLease(uid, sessionId, nowMs))
}

export async function heartbeatControlLease(
  eventId: string,
  uid: string,
  sessionId: string,
): Promise<void> {
  const db = getDb()
  const ref = doc(db, controlLeaseDoc(eventId))
  const nowMs = Date.now()
  await updateDoc(ref, {
    holderUid: uid,
    holderSessionId: sessionId,
    heartbeatAtMs: nowMs,
  })
}

export async function releaseControlLease(
  eventId: string,
  uid: string,
  sessionId: string,
): Promise<void> {
  const db = getDb()
  const ref = doc(db, controlLeaseDoc(eventId))
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const lease = assertLease(snap.data())
  if (!lease) return
  if (!isLeaseHolder(lease, uid, sessionId, Date.now())) return
  await deleteDoc(ref)
}
