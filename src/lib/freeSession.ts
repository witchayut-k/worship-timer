export const SESSION_ROOM_STORAGE_KEY = 'controlstage:session-room-id'

export function getSessionRoomId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const id = window.sessionStorage.getItem(SESSION_ROOM_STORAGE_KEY)
    return id && id.trim() ? id : null
  } catch {
    return null
  }
}

export function ensureSessionRoomId(): string {
  const existing = getSessionRoomId()
  if (existing) return existing
  const next = Date.now().toString(36)
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(SESSION_ROOM_STORAGE_KEY, next)
    }
  } catch {
    // ignore storage failures; fall back to in-memory id
  }
  return next
}

export function isSessionRoomId(eventId: string): boolean {
  const current = getSessionRoomId()
  return Boolean(current && current === eventId)
}

export function sessionRoomSetupPath(): string {
  const id = ensureSessionRoomId()
  return `/setup/${id}`
}

export function sessionRoomControlPath(): string {
  const id = ensureSessionRoomId()
  return `/start/${id}`
}
