import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
} from 'firebase/firestore'
import { getDb } from './firebase'
import type { EventDoc, ProgramItem, RuntimeState, WorshipEvent } from '../domain/types'
import { eventsCol, eventDoc, programItemsCol, runtimeStateDoc } from './firestorePaths'

function assertData<T>(data: DocumentData | undefined): T {
  if (!data) throw new Error('Missing document data')
  return data as T
}

export async function loadEvent(eventId: string) {
  const db = getDb()
  const snap = await getDoc(doc(db, eventDoc(eventId)))
  if (!snap.exists()) return null
  return { id: snap.id, data: snap.data() as WorshipEvent }
}

export async function listEventsForUser(uid: string): Promise<EventDoc[]> {
  const db = getDb()
  const q = query(
    collection(db, eventsCol()),
    where('ownerUid', '==', uid),
    orderBy('date', 'desc'),
    orderBy('updatedAtMs', 'desc'),
    limit(100),
  )
  const snaps = await getDocs(q)
  return snaps.docs.map((d) => ({ id: d.id, data: d.data() as WorshipEvent }))
}

export async function loadProgramItems(eventId: string): Promise<ProgramItem[]> {
  const db = getDb()
  const q = query(collection(db, programItemsCol(eventId)), orderBy('order', 'asc'), limit(200))
  const snaps = await getDocs(q)
  return snaps.docs.map((d) => d.data() as ProgramItem)
}

export async function loadRuntimeState(eventId: string): Promise<RuntimeState | null> {
  const db = getDb()
  const snap = await getDoc(doc(db, runtimeStateDoc(eventId)))
  if (!snap.exists()) return null
  return snap.data() as RuntimeState
}

export async function upsertEventProgram(params: {
  eventId: string
  event: WorshipEvent
  items: ProgramItem[]
}) {
  const db = getDb()
  const { eventId, event, items } = params
  const batch = writeBatch(db)

  batch.set(doc(db, eventDoc(eventId)), event, { merge: true })

  for (const it of items) {
    const itemId = String(it.order).padStart(3, '0')
    batch.set(doc(db, `${programItemsCol(eventId)}/${itemId}`), it, { merge: true })
  }

  await batch.commit()
}

export async function upsertEventWithItems(params: {
  eventId: string
  event: WorshipEvent
  items: ProgramItem[]
  initialState: RuntimeState
}) {
  const db = getDb()
  const { eventId, event, items, initialState } = params
  const batch = writeBatch(db)

  batch.set(doc(db, eventDoc(eventId)), event, { merge: true })
  batch.set(doc(db, runtimeStateDoc(eventId)), initialState, { merge: true })

  for (const it of items) {
    const itemId = String(it.order).padStart(3, '0')
    batch.set(doc(db, `${programItemsCol(eventId)}/${itemId}`), it, { merge: true })
  }

  await batch.commit()
}

export function watchRuntimeState(eventId: string, cb: (state: RuntimeState | null) => void) {
  const db = getDb()
  return onSnapshot(doc(db, runtimeStateDoc(eventId)), (snap) => {
    if (!snap.exists()) return cb(null)
    cb(assertData<RuntimeState>(snap.data()))
  })
}

export function watchEvent(eventId: string, cb: (event: WorshipEvent | null) => void) {
  const db = getDb()
  return onSnapshot(doc(db, eventDoc(eventId)), (snap) => {
    cb(snap.exists() ? (snap.data() as WorshipEvent) : null)
  })
}

export function watchProgramItems(eventId: string, cb: (items: ProgramItem[]) => void) {
  const db = getDb()
  const q = query(collection(db, programItemsCol(eventId)), orderBy('order', 'asc'), limit(200))
  return onSnapshot(q, (snaps) => {
    cb(snaps.docs.map((d) => d.data() as ProgramItem))
  })
}

export async function writeRuntimeState(eventId: string, state: RuntimeState) {
  const db = getDb()
  await setDoc(doc(db, runtimeStateDoc(eventId)), state, { merge: true })
}

